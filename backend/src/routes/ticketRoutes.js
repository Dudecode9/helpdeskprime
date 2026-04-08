import express from "express";
import rateLimit from "express-rate-limit";
import {
  submitTicket,
  fetchTickets,
  startTicket,
  closeTicket,
  fetchCompletedTickets,
  clearCompleted,
  restoreCompleted,
} from "../controllers/ticketController.js";
import { authenticate } from "../middleware/authenticate.js";
import { createRateLimitHandler } from "../middleware/rateLimitLogger.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { submitTicketSchema, ticketIdSchema, ticketListQuerySchema } from "../schemas/ticketSchemas.js";

const router = express.Router();

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler("Too many ticket submissions. Try again later."),
});

router.post("/submit", submitLimiter, validate(submitTicketSchema), submitTicket);
router.get("/all", authenticate, requireRole("admin", "director"), validate(ticketListQuerySchema), fetchTickets);
router.get("/completed", authenticate, requireRole("admin", "director"), validate(ticketListQuerySchema), fetchCompletedTickets);
router.post("/start/:id", authenticate, requireRole("admin"), validate(ticketIdSchema), startTicket);
router.post("/close/:id", authenticate, requireRole("admin"), validate(ticketIdSchema), closeTicket);
router.post("/completed/clear", authenticate, requireRole("director"), clearCompleted);
router.post("/completed/restore/:id", authenticate, requireRole("director"), validate(ticketIdSchema), restoreCompleted);

export default router;
