import express from "express";
import { submitTicket } from "../controllers/ticketController.js";

const router = express.Router();

router.post("/submit", submitTicket);

export default router;
