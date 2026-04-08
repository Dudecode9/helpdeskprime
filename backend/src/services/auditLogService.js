import { pool } from "../config/db.js";
import { buildPaginatedResult, normalizePaginationQuery } from "../utils/pagination.js";

export async function createAuditLog({
  category,
  eventType,
  actorUserId = null,
  actorEmail = null,
  actorRole = null,
  targetType = null,
  targetId = null,
  status = "success",
  message,
  ip = null,
  userAgent = null,
  metadata = {},
}) {
  await pool.query(
    `INSERT INTO audit_logs
      (category, event_type, actor_user_id, actor_email, actor_role, target_type, target_id, status, message, ip, user_agent, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)`,
    [
      category,
      eventType,
      actorUserId,
      actorEmail,
      actorRole,
      targetType,
      targetId,
      status,
      message,
      ip,
      userAgent,
      JSON.stringify(metadata || {}),
    ]
  );
}

export async function listRecentAuditLogs(filters = {}) {
  const { page, pageSize, offset } = normalizePaginationQuery(filters, {
    page: 1,
    pageSize: 20,
    maxPageSize: 100,
  });

  const where = [];
  const values = [];

  if (filters.actorEmail) {
    values.push(`%${filters.actorEmail}%`);
    where.push(`actor_email ILIKE $${values.length}`);
  }

  if (filters.category) {
    values.push(filters.category);
    where.push(`category = $${values.length}`);
  }

  if (filters.eventType) {
    values.push(filters.eventType);
    where.push(`event_type = $${values.length}`);
  }

  if (filters.status) {
    values.push(filters.status);
    where.push(`status = $${values.length}`);
  }

  if (filters.dateFrom) {
    values.push(filters.dateFrom);
    where.push(`created_at >= $${values.length}::timestamp`);
  }

  if (filters.dateTo) {
    values.push(filters.dateTo);
    where.push(`created_at <= $${values.length}::timestamp`);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM audit_logs
     ${whereClause}`,
    values
  );

  values.push(pageSize, offset);
  const result = await pool.query(
    `SELECT id, category, event_type, actor_user_id, actor_email, actor_role, target_type, target_id, status, message, ip, user_agent, metadata, created_at
     FROM audit_logs
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${values.length - 1}
     OFFSET $${values.length}`,
    values
  );

  return buildPaginatedResult(result.rows, countResult.rows[0].total, page, pageSize);
}
