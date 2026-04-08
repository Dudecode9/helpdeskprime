import express from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../middleware/authenticate.js";
import { createRateLimitHandler } from "../middleware/rateLimitLogger.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, refreshSchema } from "../schemas/authSchemas.js";
import {
  getCurrentUser,
  heartbeat,
  loginAdmin,
  loginDirector,
  logout,
  refreshSession,
} from "../controllers/authController.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler("Too many login attempts. Try again later."),
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler("Too many refresh attempts. Try again later."),
});

router.post("/login/admin", loginLimiter, validate(loginSchema), loginAdmin);
router.post("/login/director", loginLimiter, validate(loginSchema), loginDirector);
router.post("/refresh", refreshLimiter, validate(refreshSchema), refreshSession);
router.post("/logout", logout);
router.get("/me", authenticate, getCurrentUser);
router.post("/heartbeat", authenticate, heartbeat);

export default router;
