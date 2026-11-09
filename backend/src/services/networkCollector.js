import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const PROC_NET_DEV = "/proc/net/dev";
const SYS_CLASS_NET = "/sys/class/net";

export function parseProcNetDev(rawText, includeLoopback = false) {
  const lines = rawText.split(/\r?\n\s*/).filter(Boolean);
  if (lines.length < 3) {
    return {};
  }

  const parsed = {};

  for (const line of lines.slice(2)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const parts = trimmed.split(/\s+/);
    const interfaceName = parts[0].replace(":", "");

    if (!includeLoopback && interfaceName === "lo") {
      continue;
    }

    if (parts.length < 17) {
      continue;
    }

    const values = parts.slice(1).map((value) => Number(value) || 0);
    const [
      rxBytes,
      rxPackets,
      rxErrors,
      rxDropped,
      rxFifo,
      rxFrame,
      rxCompressed,
      rxMulticast,
      txBytes,
      txPackets,
      txErrors,
      txDropped,
      txFifo,
      txColls,
      txCarrier,
      txCompressed,
    ] = values;

    parsed[interfaceName] = {
      rx_bytes: Number(rxBytes || 0),
      tx_bytes: Number(txBytes || 0),
      rx_packets: Number(rxPackets || 0),
      tx_packets: Number(txPackets || 0),
      rx_errors: Number(rxErrors || 0),
      tx_errors: Number(txErrors || 0),
      rx_dropped: Number(rxDropped || 0),
      tx_dropped: Number(txDropped || 0),
      rx_fifo: Number(rxFifo || 0),
      tx_fifo: Number(txFifo || 0),
      rx_frame: Number(rxFrame || 0),
      tx_colls: Number(txColls || 0),
      tx_carrier: Number(txCarrier || 0),
      rx_compressed: Number(rxCompressed || 0),
      tx_compressed: Number(txCompressed || 0),
    };
  }

  return parsed;
}

function getInterfaceIpDetails(interfaceName) {
  const interfaces = os.networkInterfaces() || {};
  const details = interfaces[interfaceName] || [];

  const ipv4Address =
    details.find((detail) => detail.family === "IPv4" && !detail.internal)?.address ||
    details.find((detail) => detail.family === "IPv4")?.address ||
    null;

  const ipv6Address =
    details.find((detail) => detail.family === "IPv6" && !detail.internal)?.address ||
    details.find((detail) => detail.family === "IPv6")?.address ||
    null;

  return { ipv4Address, ipv6Address };
}

function normalizeInterfaceState(rawState) {
  const state = String(rawState || "unknown").trim().toLowerCase();
  if (["up", "running", "unknown"].includes(state)) {
    return state;
  }

  if (["down", "dormant", "lowerlayerdown", "notpresent", "testing"].includes(state)) {
    return state;
  }

  return "unknown";
}

export function calculateRate(previousValue, currentValue, elapsedMs) {
  if (!Number.isFinite(previousValue) || !Number.isFinite(currentValue) || elapsedMs <= 0) {
    return 0;
  }

  if (currentValue < previousValue) {
    return 0;
  }

  return (currentValue - previousValue) / (elapsedMs / 1000);
}

export function buildMetricRow(currentInterface, previousInterface, elapsedMs, recordedAt = new Date()) {
  const base = {
    interface_name: currentInterface.name,
    collected_at: new Date(recordedAt).toISOString(),
    status: currentInterface.operstate || "unknown",
    is_up: currentInterface.is_up,
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
    return {
      ...base,
      rx_bytes_per_sec: 0,
      tx_bytes_per_sec: 0,
      rx_packets_per_sec: 0,
      tx_packets_per_sec: 0,
    };
  }

  return {
    ...base,
    rx_bytes_per_sec: calculateRate(previousInterface.rx_bytes, currentInterface.rx_bytes, elapsedMs),
    tx_bytes_per_sec: calculateRate(previousInterface.tx_bytes, currentInterface.tx_bytes, elapsedMs),
    rx_packets_per_sec: calculateRate(previousInterface.rx_packets, currentInterface.rx_packets, elapsedMs),
    tx_packets_per_sec: calculateRate(previousInterface.tx_packets, currentInterface.tx_packets, elapsedMs),
  };
}

export function buildMetricRows(currentSnapshot, previousSnapshot, capturedAt = new Date()) {
  const currentEntries = currentSnapshot || {};
  const previousEntries = previousSnapshot || {};
  const interfaceNames = new Set([...Object.keys(currentEntries), ...Object.keys(previousEntries)]);
  const rows = [];
  const currentTimestamp = new Date(capturedAt).getTime();

  for (const interfaceName of interfaceNames) {
    const currentInterface = currentEntries[interfaceName];
    if (!currentInterface) {
      continue;
    }

    const previousInterface = previousEntries[interfaceName] || null;
    const previousTimestamp = previousInterface?.timestamp || currentTimestamp - 1000;
    const elapsedMs = previousInterface && previousInterface.timestamp
      ? Math.max(1000, currentTimestamp - Number(new Date(previousInterface.timestamp).getTime()))
      : 1000;

    rows.push(buildMetricRow(currentInterface, previousInterface, elapsedMs, capturedAt));
  }

  return rows;
}

export function diffInterfaceNames(previousSnapshot = {}, currentSnapshot = {}) {
  const previousNames = new Set(Object.keys(previousSnapshot || {}));
  const currentNames = new Set(Object.keys(currentSnapshot || {}));

  return {
    added: [...currentNames].filter((name) => !previousNames.has(name)),
    removed: [...previousNames].filter((name) => !currentNames.has(name)),
    unchanged: [...currentNames].filter((name) => previousNames.has(name)),
  };
}

export async function collectNetworkSnapshot(includeLoopback = false) {
  const rawText = await fs.readFile(PROC_NET_DEV, "utf8");
  const procSnapshot = parseProcNetDev(rawText, includeLoopback);
  const snapshot = {};

  for (const [interfaceName, counters] of Object.entries(procSnapshot)) {
    const interfacePath = path.join(SYS_CLASS_NET, interfaceName);

    let macAddress = null;
    let operstate = "unknown";
    let flags = 0;
    let isAdminUp = null;
    let carrier = null;

    try {
      const rawAddress = await fs.readFile(path.join(interfacePath, "address"), "utf8");
      macAddress = rawAddress.trim() || null;
    } catch {
      macAddress = null;
    }

    try {
      const rawState = await fs.readFile(path.join(interfacePath, "operstate"), "utf8");
      operstate = normalizeInterfaceState(rawState);
    } catch {
      operstate = "unknown";
    }

    try {
      const rawFlags = await fs.readFile(path.join(interfacePath, "flags"), "utf8");
      const parsedFlags = Number.parseInt(rawFlags.trim(), 16);
      if (Number.isFinite(parsedFlags)) {
        flags = parsedFlags;
        isAdminUp = Boolean(flags & 0x1);
      }
    } catch {
      flags = 0;
    }

    try {
      const rawCarrier = await fs.readFile(path.join(interfacePath, "carrier"), "utf8");
      carrier = rawCarrier.trim() === "1";
    } catch {
      carrier = null;
    }

    const { ipv4Address, ipv6Address } = getInterfaceIpDetails(interfaceName);
    const isLoopback = interfaceName === "lo" || Boolean(flags & 0x8);
    const isUp = operstate === "up" || operstate === "running";

    snapshot[interfaceName] = {
      name: interfaceName,
      mac_address: macAddress,
      ipv4_address: ipv4Address,
      ipv6_address: ipv6Address,
      operstate,
      status: operstate,
      is_up: isUp,
      is_admin_up: isAdminUp,
      carrier,
      is_loopback: isLoopback,
      rx_bytes: Number(counters.rx_bytes || 0),
      tx_bytes: Number(counters.tx_bytes || 0),
      rx_packets: Number(counters.rx_packets || 0),
      tx_packets: Number(counters.tx_packets || 0),
      rx_errors: Number(counters.rx_errors || 0),
      tx_errors: Number(counters.tx_errors || 0),
      rx_dropped: Number(counters.rx_dropped || 0),
      tx_dropped: Number(counters.tx_dropped || 0),
      timestamp: new Date(),
    };
  }

  Object.defineProperty(snapshot, "timestamp", {
    value: new Date(),
    enumerable: false,
  });

  return snapshot;
}
