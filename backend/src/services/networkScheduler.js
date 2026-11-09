import { logger } from "../utils/logger.js";
import { collectNetworkSnapshot } from "./networkCollector.js";
import { upsertNetworkInterfaces, insertNetworkMetrics } from "./networkMonitorService.js";
import { createAnomalyState, detectNetworkAnomalies } from "./networkAnomalyService.js";
import { getAnomalySettings, listActiveNetworkIncidents, syncNetworkIncidents } from "./networkIncidentService.js";

let collectionInterval = null;
let flushInterval = null;
let lastSnapshot = null;
let pendingMetrics = [];
let schedulerStarted = false;
let collectionRunning = false;
let flushRunning = false;
let anomalyState = createAnomalyState();
let incidentsInitialized = false;

export function startNetworkMonitoring(options = {}) {
  if (schedulerStarted) {
    return;
  }

  const collectIntervalMs = Number(options.collectIntervalMs || 1000);
  const flushIntervalMs = Number(options.flushIntervalMs || 5000);

  collectionInterval = setInterval(async () => {
    if (collectionRunning) return;
    collectionRunning = true;
    try {
      const snapshot = await collectNetworkSnapshot(false);
      const interfaces = Object.values(snapshot);

      if (interfaces.length > 0) {
        await upsertNetworkInterfaces(interfaces);
      }

      if (!incidentsInitialized) {
        const activeIncidents = await listActiveNetworkIncidents();
        for (const incident of activeIncidents) anomalyState.knownInterfaces.add(incident.interface_name);
        incidentsInitialized = true;
      }

      const settings = await getAnomalySettings();
      const events = detectNetworkAnomalies({
        currentSnapshot: snapshot,
        previousSnapshot: lastSnapshot || {},
        state: anomalyState,
        settings,
      });
      await syncNetworkIncidents(events, anomalyState.activeKeys);

      if (lastSnapshot) {
        const capturedAt = new Date();
        const previousTimestamp = Number(lastSnapshot.timestamp || capturedAt.getTime() - collectIntervalMs);
        const elapsedMs = Math.max(1000, Number(capturedAt) - previousTimestamp);
        const metricRows = [];

        for (const [interfaceName, currentInterface] of Object.entries(snapshot)) {
          const previousInterface = lastSnapshot[interfaceName];
          if (!currentInterface) {
            continue;
          }

          const group = {
            interface_name: interfaceName,
            collected_at: capturedAt.toISOString(),
            status: currentInterface.operstate || "unknown",
            is_up: Boolean(currentInterface.is_up),
            is_admin_up: Boolean(currentInterface.is_admin_up),
            carrier: currentInterface.carrier,
            rx_bytes: Number(currentInterface.rx_bytes || 0),
            tx_bytes: Number(currentInterface.tx_bytes || 0),
            rx_packets: Number(currentInterface.rx_packets || 0),
            tx_packets: Number(currentInterface.tx_packets || 0),
            rx_errors: Number(currentInterface.rx_errors || 0),
            tx_errors: Number(currentInterface.tx_errors || 0),
            rx_dropped: Number(currentInterface.rx_dropped || 0),
            tx_dropped: Number(currentInterface.tx_dropped || 0),
          };

          if (!previousInterface) {
            metricRows.push({
              ...group,
              rx_bytes_per_sec: 0,
              tx_bytes_per_sec: 0,
              rx_packets_per_sec: 0,
              tx_packets_per_sec: 0,
            });
            continue;
          }

          const rxBytesRate =
            currentInterface.rx_bytes >= previousInterface.rx_bytes
              ? (currentInterface.rx_bytes - previousInterface.rx_bytes) / (elapsedMs / 1000)
              : 0;
          const txBytesRate =
            currentInterface.tx_bytes >= previousInterface.tx_bytes
              ? (currentInterface.tx_bytes - previousInterface.tx_bytes) / (elapsedMs / 1000)
              : 0;
          const rxPacketsRate =
            currentInterface.rx_packets >= previousInterface.rx_packets
              ? (currentInterface.rx_packets - previousInterface.rx_packets) / (elapsedMs / 1000)
              : 0;
          const txPacketsRate =
            currentInterface.tx_packets >= previousInterface.tx_packets
              ? (currentInterface.tx_packets - previousInterface.tx_packets) / (elapsedMs / 1000)
              : 0;

          metricRows.push({
            ...group,
            rx_bytes_per_sec: rxBytesRate,
            tx_bytes_per_sec: txBytesRate,
            rx_packets_per_sec: rxPacketsRate,
            tx_packets_per_sec: txPacketsRate,
          });
        }

        pendingMetrics.push(...metricRows);
      }

      lastSnapshot = snapshot;
    } catch (error) {
      logger.error("network.monitor.collection.failed", {
        errorMessage: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : null,
      });
    } finally {
      collectionRunning = false;
    }
  }, collectIntervalMs);

  flushInterval = setInterval(async () => {
    if (flushRunning || pendingMetrics.length === 0) {
      return;
    }

    flushRunning = true;
    const currentBatch = pendingMetrics.splice(0, pendingMetrics.length);

    try {
      await insertNetworkMetrics(currentBatch);
    } catch (error) {
      logger.error("network.monitor.flush.failed", {
        errorMessage: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : null,
      });
      pendingMetrics.unshift(...currentBatch);
    } finally {
      flushRunning = false;
    }
  }, flushIntervalMs);

  schedulerStarted = true;
  logger.info("network.monitor.scheduler.started", { collectIntervalMs, flushIntervalMs });
}

export async function stopNetworkMonitoring() {
  if (collectionInterval) {
    clearInterval(collectionInterval);
    collectionInterval = null;
  }

  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }

  if (pendingMetrics.length > 0) {
    try {
      await insertNetworkMetrics(pendingMetrics);
      pendingMetrics = [];
    } catch (error) {
      logger.error("network.monitor.shutdown.flush.failed", {
        errorMessage: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : null,
      });
    }
  }

  schedulerStarted = false;
  lastSnapshot = null;
  anomalyState = createAnomalyState();
  incidentsInitialized = false;
  logger.info("network.monitor.scheduler.stopped");
}
