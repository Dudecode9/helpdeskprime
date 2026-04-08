import {
  createTicket,
  getAllTickets,
  completeTicket,
  getCompletedTickets,
  clearCompletedTickets,
  restoreCompletedTicket,
  markTicketInProgress,
} from "../services/ticketService.js";
import { createAuditLog } from "../services/auditLogService.js";
import { getRequestMeta } from "../utils/requestContext.js";

export async function submitTicket(req, res) {
  const { email, phone, message } = req.validated?.body || req.body;
  const { ip, userAgent } = getRequestMeta(req);

  try {
    const ticket = await createTicket(email, phone, message);
    await createAuditLog({
      category: "audit",
      eventType: "ticket.created",
      targetType: "ticket",
      targetId: String(ticket.id),
      status: "success",
      message: `Ticket ${ticket.id} created`,
      ip,
      userAgent,
      metadata: { email: ticket.email, status: ticket.status },
    });
    res.json({ success: true, ticket });
  } catch {
    res.status(500).json({ success: false, message: "Failed to submit ticket" });
  }
}

export async function fetchTickets(req, res) {
  try {
    const tickets = await getAllTickets(req.query);
    res.json({ success: true, ...tickets });
  } catch {
    res.status(500).json({ success: false, message: "Failed to load tickets" });
  }
}

export async function fetchCompletedTickets(req, res) {
  try {
    const tickets = await getCompletedTickets(req.query);
    res.json({ success: true, ...tickets });
  } catch {
    res.status(500).json({ success: false, message: "Failed to load completed tickets" });
  }
}

export async function startTicket(req, res) {
  const { id } = req.validated?.params || req.params;
  const adminEmail = req.user?.email;
  const { ip, userAgent } = getRequestMeta(req);

  try {
    const ticket = await markTicketInProgress(id, adminEmail);
    await createAuditLog({
      category: "audit",
      eventType: "ticket.in_progress",
      actorUserId: req.user?.id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      targetType: "ticket",
      targetId: String(id),
      status: "success",
      message: `Ticket ${id} moved to in_progress`,
      ip,
      userAgent,
      metadata: { status: ticket.status, adminEmail: ticket.admin_email },
    });
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function closeTicket(req, res) {
  const { id } = req.validated?.params || req.params;
  const adminEmail = req.user?.email;
  const { ip, userAgent } = getRequestMeta(req);

  try {
    const result = await completeTicket(id, adminEmail);
    await createAuditLog({
      category: "audit",
      eventType: "ticket.closed",
      actorUserId: req.user?.id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      targetType: "ticket",
      targetId: String(id),
      status: "success",
      message: `Ticket ${id} closed`,
      ip,
      userAgent,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function clearCompleted(req, res) {
  const { ip, userAgent } = getRequestMeta(req);

  try {
    await clearCompletedTickets();
    await createAuditLog({
      category: "audit",
      eventType: "ticket.completed.cleared",
      actorUserId: req.user?.id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      targetType: "completed_tickets",
      status: "success",
      message: "Completed tickets cleared",
      ip,
      userAgent,
    });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: "Failed to clear completed tickets" });
  }
}

export async function restoreCompleted(req, res) {
  const { id } = req.validated?.params || req.params;
  const { ip, userAgent } = getRequestMeta(req);

  try {
    const result = await restoreCompletedTicket(id);
    await createAuditLog({
      category: "audit",
      eventType: "ticket.restored",
      actorUserId: req.user?.id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      targetType: "completed_ticket",
      targetId: String(id),
      status: "success",
      message: `Completed ticket ${id} restored`,
      ip,
      userAgent,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
