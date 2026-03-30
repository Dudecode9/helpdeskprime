import express from "express";
import { submitTicket, fetchTickets } from "../controllers/ticketController.js";

const router = express.Router();

router.post("/submit", submitTicket);
router.get("/all", fetchTickets);

export default router;
