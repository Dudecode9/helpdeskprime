// src/services/ticketService.js
import { pool } from "../config/db.js";

// Создать новую заявку
export async function createTicket(email, phone, message) {
  const result = await pool.query(
    "INSERT INTO tickets (email, phone, message) VALUES ($1, $2, $3) RETURNING *",
    [email, phone, message]
  );
  return result.rows[0];
}

// Получить все активные заявки
export async function getAllTickets() {
  const result = await pool.query(
    "SELECT * FROM tickets ORDER BY created_at DESC"
  );
  return result.rows;
}

// Получить заявку по ID
export async function getTicketById(id) {
  const result = await pool.query(
    "SELECT * FROM tickets WHERE id = $1",
    [id]
  );
  return result.rows[0];
}

// Получить закрытые заявки
export async function getCompletedTickets() {
  const result = await pool.query(
    "SELECT * FROM completed_tickets ORDER BY completed_at DESC"
  );
  return result.rows;
}

// Закрыть заявку (перенести в completed_tickets)
export async function completeTicket(id, adminEmail) {
  const ticket = await getTicketById(id);
  if (!ticket) throw new Error("Ticket not found");

  await pool.query(
    `INSERT INTO completed_tickets 
      (original_ticket_id, email, phone, message, created_at, admin_id, admin_email)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      ticket.id,
      ticket.email,
      ticket.phone,
      ticket.message,
      ticket.created_at,
      1,
      adminEmail
    ]
  );

  await pool.query("DELETE FROM tickets WHERE id = $1", [id]);

  return { success: true };
}
