import test from "node:test";
import assert from "node:assert/strict";
import { planIncidentReconciliation } from "./networkIncidentService.js";

const event = {
  type: "interface_down",
  interfaceName: "eth0",
  severity: "critical",
  description: "eth0 is unavailable",
  details: { cause: "carrier_down" },
};

const activeIncident = {
  id: 12,
  event_type: "interface_down",
  interface_name: "eth0",
  status: "acknowledged",
};

test("reconciliation opens only one new active incident per type and interface", () => {
  const plan = planIncidentReconciliation(
    [event, { ...event, description: "duplicate sample" }],
    [],
    new Set(["interface_down:eth0"])
  );
  assert.equal(plan.toOpen.length, 1);
  assert.deepEqual(plan.toResolve, []);
});

test("an active duplicate is retained without creating another incident", () => {
  const plan = planIncidentReconciliation(
    [event],
    [activeIncident],
    new Set(["interface_down:eth0"])
  );
  assert.deepEqual(plan.toOpen, []);
  assert.deepEqual(plan.toResolve, []);
});

test("recovery resolves an open or acknowledged active incident", () => {
  const plan = planIncidentReconciliation([event], [activeIncident], new Set());
  assert.deepEqual(plan.toOpen, []);
  assert.deepEqual(plan.toResolve, [activeIncident]);
});
