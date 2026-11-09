import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMetricRows,
  calculateRate,
  collectNetworkSnapshot,
  diffInterfaceNames,
  parseProcNetDev,
} from "./networkCollector.js";

test("calculateRate returns positive delta over time", () => {
  assert.equal(calculateRate(100, 300, 2000), 100);
  assert.equal(calculateRate(300, 100, 2000), 0);
  assert.equal(calculateRate(0, 0, 0), 0);
});

test("parseProcNetDev ignores loopback unless requested", () => {
  const sample = `Inter-|   Receive                                                |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
 lo: 1000 10 0 0 0 0 0 0 2000 20 0 0 0 0 0 0
 eth0: 5000 40 0 0 0 0 0 0 6000 50 0 0 0 0 0 0`;

  const withoutLoopback = parseProcNetDev(sample, false);
  const withLoopback = parseProcNetDev(sample, true);

  assert.ok(!withoutLoopback.lo);
  assert.ok(withLoopback.lo);
  assert.ok(withoutLoopback.eth0);
});

test("buildMetricRows computes expected throughput values", () => {
  const previous = {
    eth0: {
      name: "eth0",
      rx_bytes: 1000,
      tx_bytes: 2000,
      rx_packets: 10,
      tx_packets: 20,
      rx_errors: 0,
      tx_errors: 0,
      rx_dropped: 0,
      tx_dropped: 0,
      timestamp: new Date("2026-01-01T00:00:00.000Z"),
    },
  };

  const current = {
    eth0: {
      name: "eth0",
      rx_bytes: 2000,
      tx_bytes: 3000,
      rx_packets: 20,
      tx_packets: 30,
      rx_errors: 0,
      tx_errors: 0,
      rx_dropped: 0,
      tx_dropped: 0,
      timestamp: new Date("2026-01-01T00:00:05.000Z"),
    },
  };

  const rows = buildMetricRows(current, previous, new Date("2026-01-01T00:00:05.000Z"));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].rx_bytes_per_sec, 200);
  assert.equal(rows[0].tx_bytes_per_sec, 200);
  assert.equal(rows[0].rx_packets_per_sec, 2);
  assert.equal(rows[0].tx_packets_per_sec, 2);
});

test("diffInterfaceNames detects new and removed interfaces", () => {
  const previous = { lo: {}, eth0: {} };
  const current = { eth0: {}, eth1: {} };
  const diff = diffInterfaceNames(previous, current);

  assert.deepEqual(diff.added, ["eth1"]);
  assert.deepEqual(diff.removed, ["lo"]);
  assert.deepEqual(diff.unchanged, ["eth0"]);
});

test("collectNetworkSnapshot reads real Linux interface data", async () => {
  const snapshot = await collectNetworkSnapshot(false);
  assert.ok(Object.keys(snapshot).length > 0, "At least one interface should be present");
  assert.ok(snapshot.timestamp instanceof Date, "Snapshot timestamp remains available to the scheduler");

  const entries = Object.values(snapshot);
  assert.ok(entries.every((item) => typeof item.name === "string"), "Enumerated snapshot values must all be interfaces");
  assert.ok(entries.some((item) => typeof item.name === "string"));
  assert.ok(entries.some((item) => typeof item.rx_bytes === "number"));
});
