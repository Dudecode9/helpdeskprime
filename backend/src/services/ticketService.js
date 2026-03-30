import { pool } from "../config/db.js";

export async function createTicket(email, phone, message) {
  const result = await pool.query(
    "INSERT INTO tickets (email, phone, message) VALUES ($1, $2, $3) RETURNING *",
    [email, phone, message]
  );
  return result.rows[0];
}
