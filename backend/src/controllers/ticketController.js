import { createTicket, getAllTickets } from "../services/ticketService.js";

export async function submitTicket(req, res) {
  const { email, phone, message } = req.body;

  try {
    const ticket = await createTicket(email, phone, message);
    res.json({ success: true, ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to submit ticket" });
  }
}

export async function fetchTickets(req, res) {
  try {
    const tickets = await getAllTickets();
    res.json({ success: true, tickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load tickets" });
  }
}
