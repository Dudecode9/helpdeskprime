import { pool } from "../config/db.js";
import { DEFAULT_ANOMALY_SETTINGS } from "./networkAnomalyService.js";

export async function getAnomalySettings() {
  const result = await pool.query(
    `INSERT INTO network_anomaly_settings (id, settings)
     VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(DEFAULT_ANOMALY_SETTINGS)]
  );
  void result;

  const settingsResult = await pool.query("SELECT settings FROM network_anomaly_settings WHERE id = 1");
  return { ...DEFAULT_ANOMALY_SETTINGS, ...(settingsResult.rows[0]?.settings || {}) };
}

export async function updateAnomalySettings(settings) {
  const merged = { ...DEFAULT_ANOMALY_SETTINGS, ...settings };
  const result = await pool.query(
    `INSERT INTO network_anomaly_settings (id, settings, updated_at)
     VALUES (1, $1::jsonb, CURRENT_TIMESTAMP)
     ON CONFLICT (id) DO UPDATE
     SET settings = EXCLUDED.settings, updated_at = CURRENT_TIMESTAMP
     RETURNING settings`,
    [JSON.stringify(merged)]
  );
  return { ...DEFAULT_ANOMALY_SETTINGS, ...result.rows[0].settings };
}

export async function openNetworkIncident(event) {
  const interfaceResult = await pool.query("SELECT id FROM network_interfaces WHERE name = $1", [event.interfaceName]);
  const interfaceId = interfaceResult.rows[0]?.id;
  if (!interfaceId) return null;

  const result = await pool.query(
    `INSERT INTO network_incidents
      (event_type, interface_id, severity, description, details, status, opened_at, last_seen_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, 'open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT (event_type, interface_id) WHERE status <> 'resolved'
     DO UPDATE SET last_seen_at = CURRENT_TIMESTAMP, details = EXCLUDED.details
     RETURNING *`,
    [event.type, interfaceId, event.severity, event.description, JSON.stringify(event.details || {})]
  );
  return result.rows[0] || null;
}

export function planIncidentReconciliation(events = [], activeIncidents = [], activeKeys = new Set()) {
  const activeByIdentity = new Map(
    activeIncidents.map((incident) => [`${incident.event_type}:${incident.interface_name}`, incident])
  );
  const seen = new Set();
  const toOpen = events.filter((event) => {
    const identity = `${event.type}:${event.interfaceName}`;
    if (seen.has(identity) || activeByIdentity.has(identity) || !activeKeys.has(identity)) return false;
    seen.add(identity);
    return true;
  });
  const toResolve = activeIncidents.filter((incident) =>
    !activeKeys.has(`${incident.event_type}:${incident.interface_name}`)
  );
  return { toOpen, toResolve };
}

export async function listActiveNetworkIncidents() {
  const result = await pool.query(
    `SELECT ni.*, iface.name AS interface_name
     FROM network_incidents ni
     JOIN network_interfaces iface ON iface.id = ni.interface_id
     WHERE ni.status IN ('open', 'acknowledged')
     ORDER BY ni.opened_at DESC`
  );
  return result.rows;
}

export async function syncNetworkIncidents(events = [], activeKeys = new Set()) {
  const active = await listActiveNetworkIncidents();
  const { toOpen, toResolve } = planIncidentReconciliation(events, active, activeKeys);
  for (const event of toOpen) await openNetworkIncident(event);

  const resolved = [];
  for (const incident of toResolve) {
    const result = await pool.query(
      `UPDATE network_incidents
       SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status IN ('open', 'acknowledged')
       RETURNING id`,
      [incident.id]
    );
    if (result.rows[0]) resolved.push(incident.id);
  }
  return { active, resolved, opened: toOpen.length };
}

export async function getNetworkIncidentById(id) {
  const result = await pool.query(
    `SELECT ni.*, iface.name AS interface_name
     FROM network_incidents ni
     JOIN network_interfaces iface ON iface.id = ni.interface_id
     WHERE ni.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function listNetworkIncidentHistory({ status = null, type = null, limit = 100, offset = 0 } = {}) {
  const filters = [];
  const params = [];
  if (status) {
    params.push(status);
    filters.push(`ni.status = $${params.length}`);
  }
  if (type) {
    params.push(type);
    filters.push(`ni.event_type = $${params.length}`);
  }
  let query = `
    SELECT ni.*, iface.name AS interface_name
    FROM network_incidents ni
    JOIN network_interfaces iface ON iface.id = ni.interface_id
  `;
  if (filters.length) query += ` WHERE ${filters.join(" AND ")}`;
  params.push(limit, offset);
  query += ` ORDER BY ni.opened_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
  const result = await pool.query(query, params);
  return result.rows;
}

export async function acknowledgeNetworkIncident(id, actorUserId) {
  const result = await pool.query(
    `UPDATE network_incidents
     SET status = 'acknowledged', acknowledged_at = COALESCE(acknowledged_at, CURRENT_TIMESTAMP),
         acknowledged_by = COALESCE(acknowledged_by, $2), updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status IN ('open', 'acknowledged')
     RETURNING *`,
    [id, actorUserId]
  );
  return result.rows[0] || null;
}

export async function getNetworkIncidentSummary() {
  const [activeResult, statsResult] = await Promise.all([
    pool.query("SELECT COUNT(*)::integer AS count FROM network_incidents WHERE status IN ('open', 'acknowledged')"),
    pool.query(
      `SELECT event_type, COUNT(*)::integer AS count
       FROM network_incidents
       WHERE status IN ('open', 'acknowledged')
       GROUP BY event_type ORDER BY event_type`
    ),
  ]);
  return { activeCount: activeResult.rows[0]?.count || 0, byType: statsResult.rows };
}