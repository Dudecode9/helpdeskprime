import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { pool } from "../config/db.js";
import { signAccessToken } from "../utils/tokens.js";
import { listInterfacesSchema, metricsQuerySchema } from "../schemas/networkSchemas.js";
import networkRoutes from "./networkRoutes.js";

process.env.JWT_ACCESS_SECRET ||= "network-api-test-secret";

const incidentFixture = {
  id: 12,
  event_type: "interface_down",
  interface_id: 3,
  interface_name: "eth0",
  severity: "critical",
  description: "eth0 has no carrier",
  details: { cause: "carrier_down" },
  status: "open",
  opened_at: "2026-11-09T12:00:00.000Z",
  resolved_at: null,
};

test("network query schemas parse false correctly and reject invalid timestamps", () => {
  const parsed = listInterfacesSchema.parse({ body: {}, params: {}, query: { includeLoopback: "false" } });
  assert.equal(parsed.query.includeLoopback, false);

  const invalidDate = metricsQuerySchema.safeParse({
    body: {},
    params: {},
    query: { from: "not-a-date" },
  });
  assert.equal(invalidDate.success, false);
});

test("Electron network API is available without a session", async (t) => {
  const previousMode = process.env.ELECTRON_APP;
  process.env.ELECTRON_APP = "true";
  const { default: desktopRoutes } = await import("./networkRoutes.js?desktop-no-auth-test");
  if (previousMode === undefined) delete process.env.ELECTRON_APP;
  else process.env.ELECTRON_APP = previousMode;

  const originalQuery = pool.query;
  pool.query = async (statement, params = []) => {
    if (String(statement).includes("UPDATE network_incidents") && String(statement).includes("RETURNING *")) {
      assert.equal(params[1], null);
      return { rows: [{ ...incidentFixture, status: "acknowledged" }] };
    }
    return { rows: [{ name: "eth0", is_loopback: false }] };
  };
  const app = express();
  app.use("/network", desktopRoutes);
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    pool.query = originalQuery;
  });

  const response = await fetch(`http://127.0.0.1:${server.address().port}/network/interfaces`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).interfaces[0].name, "eth0");

  const acknowledgeResponse = await fetch(
    `http://127.0.0.1:${server.address().port}/network/incidents/12/acknowledge`,
    { method: "POST" }
  );
  assert.equal(acknowledgeResponse.status, 200);
  assert.equal((await acknowledgeResponse.json()).incident.status, "acknowledged");
});

test("non-desktop network API still requires authentication", async (t) => {
  const previousMode = process.env.ELECTRON_APP;
  delete process.env.ELECTRON_APP;
  const { default: serverRoutes } = await import("./networkRoutes.js?server-auth-test");
  if (previousMode !== undefined) process.env.ELECTRON_APP = previousMode;

  const originalQuery = pool.query;
  pool.query = async () => ({ rows: [] });
  const app = express();
  app.use("/network", serverRoutes);
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    pool.query = originalQuery;
  });

  const response = await fetch(`http://127.0.0.1:${server.address().port}/network/interfaces`);
  assert.equal(response.status, 401);
});

test("incident API exposes history, detail, summary, current anomalies and acknowledgment", async (t) => {
  let incident = { ...incidentFixture };
  const originalQuery = pool.query;
  pool.query = async (statement) => {
    const query = String(statement);
    if (query.includes("UPDATE user_sessions")) return { rows: [] };
    if (query.includes("SELECT COUNT(*)::integer AS count FROM network_incidents")) {
      return { rows: [{ count: incident.status === "resolved" ? 0 : 1 }] };
    }
    if (query.includes("GROUP BY event_type")) {
      return { rows: [{ event_type: incident.event_type, count: 1 }] };
    }
    if (query.includes("UPDATE network_incidents") && query.includes("RETURNING *")) {
      incident = { ...incident, status: "acknowledged", acknowledged_at: "2026-11-09T12:01:00.000Z" };
      return { rows: [incident] };
    }
    if (query.includes("WHERE ni.id = $1")) return { rows: [incident] };
    if (query.includes("WHERE ni.status IN ('open', 'acknowledged')")) {
      return { rows: incident.status === "resolved" ? [] : [incident] };
    }
    if (query.includes("FROM network_incidents ni")) return { rows: [incident] };
    return { rows: [] };
  };

  const app = express();
  app.use((req, res, next) => {
    const token = req.headers.cookie?.match(/access_token=([^;]+)/)?.[1];
    req.cookies = token ? { access_token: token } : {};
    next();
  });
  app.use("/network", networkRoutes);
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    pool.query = originalQuery;
  });

  const token = signAccessToken({ id: 7, email: "admin@example.test", role: "admin" }, "test-session");
  const baseUrl = `http://127.0.0.1:${server.address().port}/network`;
  const request = (path, options = {}) => fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { Cookie: `access_token=${token}`, ...(options.headers || {}) },
  });

  const historyResponse = await request("/incidents?limit=10");
  assert.equal(historyResponse.status, 200);
  assert.equal((await historyResponse.json()).incidents[0].id, 12);

  const detailResponse = await request("/incidents/12");
  assert.equal(detailResponse.status, 200);
  assert.equal((await detailResponse.json()).incident.interface_name, "eth0");

  const anomalyResponse = await request("/anomalies/current");
  assert.equal((await anomalyResponse.json()).anomalies.length, 1);

  const summaryResponse = await request("/incidents/summary");
  assert.equal((await summaryResponse.json()).summary.activeCount, 1);

  const acknowledgeResponse = await request("/incidents/12/acknowledge", { method: "POST" });
  assert.equal(acknowledgeResponse.status, 200);
  assert.equal((await acknowledgeResponse.json()).incident.status, "acknowledged");
});
