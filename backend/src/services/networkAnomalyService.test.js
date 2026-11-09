import test from "node:test";
import assert from "node:assert/strict";
import {
  createAnomalyState,
  detectNetworkAnomalies,
} from "./networkAnomalyService.js";

const settings = {
  trafficSpikeBytesPerSec: 1000,
  trafficSpikeMultiplier: 3,
  highTrafficBytesPerSec: 500,
  highTrafficDurationSamples: 3,
  packetErrorDelta: 2,
  packetDropDelta: 3,
};

function sample(overrides = {}) {
  return {
    name: "eth0",
    is_admin_up: true,
    operstate: "up",
    carrier: true,
    is_up: true,
    rx_bytes_per_sec: 100,
    tx_bytes_per_sec: 100,
    rx_errors: 10,
    tx_errors: 5,
    rx_dropped: 20,
    tx_dropped: 5,
    ...overrides,
  };
}

function detect(current, previous = sample(), state = createAnomalyState()) {
  const events = detectNetworkAnomalies({
    currentSnapshot: { eth0: current },
    previousSnapshot: { eth0: previous },
    state,
    settings,
  });
  return { events, state };
}

test("Interface Down distinguishes carrier loss from admin-down", () => {
  const linkDown = detect(sample({ carrier: false, operstate: "lowerlayerdown" }));
  assert.equal(linkDown.events[0].type, "interface_down");
  assert.equal(linkDown.events[0].details.cause, "carrier_down");
  assert.ok(linkDown.state.activeKeys.has("interface_down:eth0"));

  const firstObservation = detectNetworkAnomalies({
    currentSnapshot: { eth0: sample({ carrier: false, operstate: "lowerlayerdown" }) },
    settings,
  });
  assert.ok(firstObservation.some((event) => event.type === "interface_down"));

  const administrativelyDown = detect(sample({ is_admin_up: false, carrier: false, operstate: "down" }));
  assert.equal(administrativelyDown.events.length, 0);

  const unknownAdminState = detect(sample({ is_admin_up: null, carrier: false, operstate: "lowerlayerdown" }));
  assert.ok(unknownAdminState.events.some((event) => event.type === "interface_down"));
});

test("Traffic Spike detects threshold and baseline multiplier", () => {
  const { events } = detect(sample({ rx_bytes_per_sec: 4000 }));
  assert.ok(events.some((event) => event.type === "traffic_spike"));

  const previous = sample({ rx_bytes: 1000, tx_bytes: 2000, timestamp: "2026-11-09T12:00:00.000Z" });
  const current = sample({
    rx_bytes: 5000,
    tx_bytes: 2000,
    rx_bytes_per_sec: undefined,
    tx_bytes_per_sec: undefined,
    timestamp: "2026-11-09T12:00:01.000Z",
  });
  const counterEvents = detect(current, previous).events;
  assert.ok(counterEvents.some((event) => event.type === "traffic_spike" && event.details.rxBytesPerSec === 4000));

  const baselineState = createAnomalyState();
  baselineState.rateHistory.set("eth0", [2000, 2500]);
  const belowMultiplier = detect(sample({ rx_bytes_per_sec: 4000 }), sample(), baselineState);
  assert.ok(!belowMultiplier.events.some((event) => event.type === "traffic_spike"));
});

test("High Traffic requires consecutive samples", () => {
  const state = createAnomalyState();
  const currentSnapshot = { eth0: sample({ rx_bytes_per_sec: 600 }) };
  for (let index = 0; index < 2; index += 1) {
    detectNetworkAnomalies({ currentSnapshot, previousSnapshot: currentSnapshot, state, settings });
    assert.ok(!state.activeKeys.has("high_traffic:eth0"));
  }
  detectNetworkAnomalies({ currentSnapshot, previousSnapshot: currentSnapshot, state, settings });
  assert.ok(state.activeKeys.has("high_traffic:eth0"));
});

test("Packet Errors detects counter deltas instead of absolute totals", () => {
  const { events } = detect(sample({ rx_errors: 12 }));
  assert.ok(events.some((event) => event.type === "packet_errors" && event.details.delta === 2));
  assert.ok(!detect(sample()).events.some((event) => event.type === "packet_errors"));
});

test("Packet Drops detects counter deltas", () => {
  const { events } = detect(sample({ tx_dropped: 8 }));
  assert.ok(events.some((event) => event.type === "packet_drops" && event.details.delta === 3));
});

test("counter reset does not create errors or drops", () => {
  const { events } = detect(sample({ rx_errors: 0, tx_errors: 0, rx_dropped: 0, tx_dropped: 0 }));
  assert.ok(!events.some((event) => ["packet_errors", "packet_drops"].includes(event.type)));
});

test("missing interface remains active after the first missing sample", () => {
  const state = createAnomalyState();
  detectNetworkAnomalies({ currentSnapshot: { eth0: sample() }, state, settings });
  detectNetworkAnomalies({ currentSnapshot: {}, previousSnapshot: { eth0: sample() }, state, settings });
  assert.ok(state.activeKeys.has("interface_down:eth0"));
  assert.equal(detectNetworkAnomalies({ currentSnapshot: {}, state, settings }).length, 0);
  assert.ok(state.activeKeys.has("interface_down:eth0"));
});
