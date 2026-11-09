export const DEFAULT_ANOMALY_SETTINGS = Object.freeze({
  trafficSpikeBytesPerSec: 5 * 1024 * 1024,
  trafficSpikeMultiplier: 3,
  highTrafficBytesPerSec: 2 * 1024 * 1024,
  highTrafficDurationSamples: 10,
  packetErrorDelta: 3,
  packetDropDelta: 5,
});

const COUNTERS = ["rx_errors", "tx_errors", "rx_dropped", "tx_dropped"];

function finiteCounter(value) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function counterDelta(previous, current) {
  const before = finiteCounter(previous);
  const after = finiteCounter(current);
  return before === null || after === null || after < before ? null : after - before;
}

function average(values) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function anomaly(type, interfaceName, severity, description, details = {}) {
  return { type, interfaceName, severity, description, details };
}

export function createAnomalyState() {
  return {
    highTrafficSamples: new Map(),
    rateHistory: new Map(),
    knownInterfaces: new Set(),
    activeKeys: new Set(),
  };
}

export function detectNetworkAnomalies({
  currentSnapshot = {},
  previousSnapshot = {},
  state = createAnomalyState(),
  settings = DEFAULT_ANOMALY_SETTINGS,
} = {}) {
  const events = [];
  state.activeKeys = new Set();
  for (const name of Object.keys(currentSnapshot)) state.knownInterfaces.add(name);
  const names = new Set([
    ...Object.keys(currentSnapshot),
    ...Object.keys(previousSnapshot),
    ...state.knownInterfaces,
  ]);
  const normalizedSettings = { ...DEFAULT_ANOMALY_SETTINGS, ...settings };

  for (const interfaceName of names) {
    const current = currentSnapshot[interfaceName];
    const previous = previousSnapshot[interfaceName];
    const history = state.rateHistory.get(interfaceName) || [];

    if (!current) {
      state.activeKeys.add(`interface_down:${interfaceName}`);
      if (previous) {
        events.push(anomaly(
          "interface_down",
          interfaceName,
          "critical",
          `Interface ${interfaceName} is no longer present in the Linux interface list`,
          { cause: "interface_missing" }
        ));
      }
      state.highTrafficSamples.delete(interfaceName);
      state.rateHistory.delete(interfaceName);
      continue;
    }

    if (current.is_admin_up !== false) {
      const stateDown = ["down", "lowerlayerdown", "notpresent"].includes(String(current.operstate).toLowerCase());
      const carrierDown = current.carrier === false;
      if (stateDown || carrierDown) {
        state.activeKeys.add(`interface_down:${interfaceName}`);
        events.push(anomaly(
          "interface_down",
          interfaceName,
          "critical",
          carrierDown
            ? `Interface ${interfaceName} is administratively enabled but has no carrier`
            : `Interface ${interfaceName} is administratively enabled but reports ${current.operstate}`,
          { cause: carrierDown ? "carrier_down" : current.operstate }
        ));
      }
    }

    const rxRate = Number(current.rx_bytes_per_sec);
    const txRate = Number(current.tx_bytes_per_sec);
    const elapsedMs = previous && current.timestamp && previous.timestamp
      ? Math.max(1, new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime())
      : 1000;
    const rxCounterDelta = previous ? counterDelta(previous.rx_bytes, current.rx_bytes) : null;
    const txCounterDelta = previous ? counterDelta(previous.tx_bytes, current.tx_bytes) : null;
    const actualRxRate = Number.isFinite(rxRate) && rxRate >= 0
      ? rxRate
      : rxCounterDelta === null ? 0 : rxCounterDelta / (elapsedMs / 1000);
    const actualTxRate = Number.isFinite(txRate) && txRate >= 0
      ? txRate
      : txCounterDelta === null ? 0 : txCounterDelta / (elapsedMs / 1000);
    const rate = Math.max(actualRxRate, actualTxRate);
    const baseline = average(history);

    if (
      previous &&
      rate >= normalizedSettings.trafficSpikeBytesPerSec &&
      (baseline === 0 || rate >= baseline * normalizedSettings.trafficSpikeMultiplier)
    ) {
      state.activeKeys.add(`traffic_spike:${interfaceName}`);
      events.push(anomaly(
        "traffic_spike",
        interfaceName,
        "warning",
        `Traffic on ${interfaceName} spiked to ${Math.round(rate)} bytes/sec`,
        { rxBytesPerSec: actualRxRate, txBytesPerSec: actualTxRate, baselineBytesPerSec: baseline }
      ));
    }

    const highSamples = rate >= normalizedSettings.highTrafficBytesPerSec
      ? (state.highTrafficSamples.get(interfaceName) || 0) + 1
      : 0;
    state.highTrafficSamples.set(interfaceName, highSamples);

    if (highSamples >= normalizedSettings.highTrafficDurationSamples) {
      state.activeKeys.add(`high_traffic:${interfaceName}`);
      if (highSamples === normalizedSettings.highTrafficDurationSamples) {
        events.push(anomaly(
          "high_traffic",
          interfaceName,
          "warning",
          `Traffic on ${interfaceName} remained above ${normalizedSettings.highTrafficBytesPerSec} bytes/sec for ${highSamples} samples`,
          { bytesPerSec: rate, durationSamples: highSamples }
        ));
      }
    }

    const deltas = {};
    if (previous) {
      for (const counter of COUNTERS) {
        deltas[counter] = counterDelta(previous[counter], current[counter]);
      }

      const errors = [deltas.rx_errors, deltas.tx_errors].filter((value) => value !== null).reduce((sum, value) => sum + value, 0);
      const drops = [deltas.rx_dropped, deltas.tx_dropped].filter((value) => value !== null).reduce((sum, value) => sum + value, 0);

      if (errors >= normalizedSettings.packetErrorDelta) {
        state.activeKeys.add(`packet_errors:${interfaceName}`);
        events.push(anomaly("packet_errors", interfaceName, "warning", `${errors} packet errors were recorded on ${interfaceName}`, { delta: errors }));
      }
      if (drops >= normalizedSettings.packetDropDelta) {
        state.activeKeys.add(`packet_drops:${interfaceName}`);
        events.push(anomaly("packet_drops", interfaceName, "warning", `${drops} packet drops were recorded on ${interfaceName}`, { delta: drops }));
      }
    }

    if (Number.isFinite(rate) && rate >= 0) {
      history.push(rate);
      if (history.length > 30) history.shift();
      state.rateHistory.set(interfaceName, history);
    }
  }

  return events;
}