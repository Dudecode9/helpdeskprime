import { pool } from "../config/db.js";
import { buildPaginatedResult, normalizePaginationQuery } from "../utils/pagination.js";

export async function createTicket(email, phone, message) {
  const result = await pool.query(
    "INSERT INTO tickets (email, phone, message, status) VALUES ($1, $2, $3, 'active') RETURNING *",
    [email, phone, message]
  );
  return result.rows[0];
}

export async function getAllTickets(filters = {}) {
  return listTicketsFromTable("tickets", "created_at", filters);
}

export async function getTicketById(id) {
  const result = await pool.query("SELECT * FROM tickets WHERE id = $1", [id]);
  return result.rows[0];
}

export async function getCompletedTickets(filters = {}) {
  return listTicketsFromTable("completed_tickets", "completed_at", filters);
}

export async function completeTicket(id, adminEmail) {
  const ticket = await getTicketById(id);
  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const adminResult = await pool.query("SELECT id, email FROM admins WHERE email = $1", [adminEmail]);
  const admin = adminResult.rows[0];

  if (!admin) {
    throw new Error("Admin not found");
  }

  await pool.query(
    `INSERT INTO completed_tickets
      (original_ticket_id, email, phone, message, created_at, admin_id, admin_email)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [ticket.id, ticket.email, ticket.phone, ticket.message, ticket.created_at, admin.id, admin.email]
  );

  await pool.query("DELETE FROM tickets WHERE id = $1", [id]);

  return { success: true };
}

export async function markTicketInProgress(id, adminEmail) {
  const ticket = await getTicketById(id);
  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const result = await pool.query(
    `UPDATE tickets
     SET status = 'in_progress',
         admin_email = $2
     WHERE id = $1
     RETURNING *`,
    [id, adminEmail]
  );

  return result.rows[0];
}

export async function clearCompletedTickets() {
  await pool.query("DELETE FROM completed_tickets");
  return { success: true };
}

export async function restoreCompletedTicket(id) {
  const result = await pool.query("SELECT * FROM completed_tickets WHERE id = $1", [id]);
  const ticket = result.rows[0];

  if (!ticket) {
    throw new Error("Completed ticket not found");
  }

  await pool.query(
    `INSERT INTO tickets (email, phone, message, status, admin_email, created_at)
     VALUES ($1, $2, $3, 'active', NULL, $4)`,
    [ticket.email, ticket.phone, ticket.message, ticket.created_at]
  );

  await pool.query("DELETE FROM completed_tickets WHERE id = $1", [id]);

  return { success: true };
}

async function listTicketsFromTable(tableName, dateColumn, filters) {
  const { page, pageSize, offset } = normalizePaginationQuery(filters, {
    page: 1,
    pageSize: 10,
    maxPageSize: 100,
  });

  const where = [];
  const values = [];

  if (filters.email) {
    values.push(`%${filters.email}%`);
    where.push(`email ILIKE $${values.length}`);
  }

  if (filters.status && tableName === "tickets") {
    values.push(filters.status);
    where.push(`status = $${values.length}`);
  }

  if (filters.dateFrom) {
    values.push(filters.dateFrom);
    where.push(`${dateColumn} >= $${values.length}::timestamp`);
  }

  if (filters.dateTo) {
    values.push(filters.dateTo);
    where.push(`${dateColumn} <= $${values.length}::timestamp`);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM ${tableName} ${whereClause}`,
    values
  );

  values.push(pageSize, offset);
  const result = await pool.query(
    `SELECT *
     FROM ${tableName}
     ${whereClause}
     ORDER BY ${dateColumn} DESC
     LIMIT $${values.length - 1}
     OFFSET $${values.length}`,
    values
  );

  return buildPaginatedResult(result.rows, countResult.rows[0].total, page, pageSize);
}
