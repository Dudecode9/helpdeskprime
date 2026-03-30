// src/routes/ticketRoutes.js
import express from "express";
import { 
  submitTicket, 
  fetchTickets, 
  closeTicket,
  fetchCompletedTickets,
  clearCompleted,
  restoreCompleted
} from "../controllers/ticketController.js";

const router = express.Router();

router.post("/submit", submitTicket);
router.get("/all", fetchTickets);
router.get("/completed", fetchCompletedTickets);
router.post("/close/:id", closeTicket);

// Очистить закрытые заявки
router.post("/completed/clear", clearCompleted);

// 🔥 Вернуть закрытую заявку обратно в активные
router.post("/completed/restore/:id", restoreCompleted);

export default router;
