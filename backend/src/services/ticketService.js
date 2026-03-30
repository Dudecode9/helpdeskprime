import { pool } from "../config/db.js";

export async function createTicket(email, phone, message) {
  const result = await pool.query(
    "INSERT INTO tickets (email, phone, message) VALUES ($1, $2, $3) RETURNING *",
    [email, phone, message]
  );
  return result.rows[0];
}

export async function getAllTickets() {
  const result = await pool.query(
    "SELECT * FROM tickets ORDER BY created_at DESC"
  );
  return result.rows;
}
