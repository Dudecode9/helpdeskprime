// src/controllers/ticketController.js
import { 
  createTicket, 
  getAllTickets, 
  completeTicket,
  getCompletedTickets
} from "../services/ticketService.js";

// Создать заявку
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

// Получить активные заявки
export async function fetchTickets(req, res) {
  try {
    const tickets = await getAllTickets();
    res.json({ success: true, tickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load tickets" });
  }
}

// Получить закрытые заявки
export async function fetchCompletedTickets(req, res) {
  try {
    const tickets = await getCompletedTickets();
    res.json({ success: true, tickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load completed tickets" });
  }
}

// Закрыть заявку
export async function closeTicket(req, res) {
  const { id } = req.params;
  const { adminEmail } = req.body;

  try {
    const result = await completeTicket(id, adminEmail);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}
