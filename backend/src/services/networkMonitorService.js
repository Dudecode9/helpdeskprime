import { pool } from "../config/db.js";

export async function upsertNetworkInterface(interfaceInfo) {
  const { name, mac_address, ipv4_address, ipv6_address, operstate, is_loopback, is_up, is_admin_up, carrier } = interfaceInfo;

  await pool.query(
    `INSERT INTO network_interfaces
      (name, mac_address, ipv4_address, ipv6_address, operstate, is_loopback, is_up, is_admin_up, carrier, last_seen_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT (name) DO UPDATE
     SET mac_address = EXCLUDED.mac_address,
         ipv4_address = EXCLUDED.ipv4_address,
         ipv6_address = EXCLUDED.ipv6_address,
         operstate = EXCLUDED.operstate,
         is_loopback = EXCLUDED.is_loopback,
         is_up = EXCLUDED.is_up,
         is_admin_up = EXCLUDED.is_admin_up,
         carrier = EXCLUDED.carrier,
         last_seen_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP`,
    [name, mac_address, ipv4_address, ipv6_address, operstate, is_loopback, is_up, is_admin_up, carrier]
  );
}

export async function upsertNetworkInterfaces(interfaces = []) {
  for (const interfaceInfo of interfaces) {
    await upsertNetworkInterface(interfaceInfo);
  }
}

export async function insertNetworkMetrics(metrics = []) {
  if (!Array.isArray(metrics) || metrics.length === 0) {
    return [];
  }

  const inserted = [];

  for (const metric of metrics) {
    const interfaceResult = await pool.query(
      "SELECT id FROM network_interfaces WHERE name = $1",
      [metric.interface_name]
    );

    const interfaceRow = interfaceResult.rows[0];
    if (!interfaceRow) {
      continue;
    }

    const result = await pool.query(
      `INSERT INTO network_metrics
        (interface_id, collected_at, rx_bytes, tx_bytes, rx_packets, tx_packets, rx_errors, tx_errors, rx_dropped, tx_dropped,
         rx_bytes_per_sec, tx_bytes_per_sec, rx_packets_per_sec, tx_packets_per_sec, status, is_up, is_admin_up, carrier)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        interfaceRow.id,
        metric.collected_at,
        metric.rx_bytes,
        metric.tx_bytes,
        metric.rx_packets,
        metric.tx_packets,
        metric.rx_errors,
        metric.tx_errors,
        metric.rx_dropped,
        metric.tx_dropped,
        metric.rx_bytes_per_sec,
        metric.tx_bytes_per_sec,
        metric.rx_packets_per_sec,
        metric.tx_packets_per_sec,
        metric.status,
        metric.is_up,
        metric.is_admin_up,
        metric.carrier,
      ]
    );

    inserted.push(result.rows[0]);
  }

  return inserted;
}

export async function listNetworkInterfaces(includeLoopback = false) {
  const query = includeLoopback
    ? "SELECT * FROM network_interfaces ORDER BY name ASC"
    : "SELECT * FROM network_interfaces WHERE is_loopback = FALSE ORDER BY name ASC";

  const result = await pool.query(query);
  return result.rows;
}

export async function getNetworkInterfaceByName(interfaceName) {
  const result = await pool.query(
    "SELECT * FROM network_interfaces WHERE name = $1",
    [interfaceName]
  );

  return result.rows[0] || null;
}

export async function getLatestMetrics({ interfaceName = null, limit = 20 } = {}) {
  let query = `
    SELECT nm.*, ni.name AS interface_name
    FROM network_metrics nm
    JOIN network_interfaces ni ON ni.id = nm.interface_id
  `;

  const params = [];

  if (interfaceName) {
    params.push(interfaceName);
    query += ` WHERE ni.name = $${params.length}`;
  }

  query += ` ORDER BY nm.collected_at DESC LIMIT $${params.length + 1}`;
  params.push(Math.max(1, Number(limit) || 20));

  const result = await pool.query(query, params);
  return result.rows;
}

export async function getMetricHistory({ interfaceName = null, from = null, to = null, limit = 100 } = {}) {
  let query = `
    SELECT nm.*, ni.name AS interface_name
    FROM network_metrics nm
    JOIN network_interfaces ni ON ni.id = nm.interface_id
  `;

  const params = [];
  const filters = [];

  if (interfaceName) {
    params.push(interfaceName);
    filters.push(`ni.name = $${params.length}`);
  }

  if (from) {
    params.push(from);
    filters.push(`nm.collected_at >= $${params.length}::timestamptz`);
  }

  if (to) {
    params.push(to);
    filters.push(`nm.collected_at <= $${params.length}::timestamptz`);
  }

  if (filters.length) {
    query += ` WHERE ${filters.join(" AND ")}`;
  }

  query += ` ORDER BY nm.collected_at DESC LIMIT $${params.length + 1}`;
  params.push(Math.max(1, Number(limit) || 100));

  const result = await pool.query(query, params);
  return result.rows;
}

export async function getCurrentInterfaceSpeed(interfaceName) {
  const interfaceRow = await getNetworkInterfaceByName(interfaceName);
  if (!interfaceRow) {
    return null;
  }

  const result = await pool.query(
    `SELECT rx_bytes_per_sec, tx_bytes_per_sec, rx_packets_per_sec, tx_packets_per_sec, collected_at
     FROM network_metrics
     WHERE interface_id = $1
     ORDER BY collected_at DESC
     LIMIT 2`,
    [interfaceRow.id]
  );

  if (result.rows.length === 0) {
    return { interfaceName, rx_bytes_per_sec: 0, tx_bytes_per_sec: 0, rx_packets_per_sec: 0, tx_packets_per_sec: 0 };
  }

  const latest = result.rows[0];
  return {
    interfaceName,
    rx_bytes_per_sec: Number(latest.rx_bytes_per_sec || 0),
    tx_bytes_per_sec: Number(latest.tx_bytes_per_sec || 0),
    rx_packets_per_sec: Number(latest.rx_packets_per_sec || 0),
    tx_packets_per_sec: Number(latest.tx_packets_per_sec || 0),
    collected_at: latest.collected_at,
  };
}
