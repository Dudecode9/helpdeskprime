// src/routes/ticketRoutes.js
import express from "express";
import { 
  submitTicket, 
  fetchTickets, 
  closeTicket,
  fetchCompletedTickets
} from "../controllers/ticketController.js";

const router = express.Router();

router.post("/submit", submitTicket);
router.get("/all", fetchTickets);
router.get("/completed", fetchCompletedTickets);
router.post("/close/:id", closeTicket);

export default router;
