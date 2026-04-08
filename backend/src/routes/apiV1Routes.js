import express from "express";
import authRoutes from "./authRoutes.js";
import adminRoutes from "./adminRoutes.js";
import ticketRoutes from "./ticketRoutes.js";
import directorRoutes from "./directorRoutes.js";
import { getHealth } from "../controllers/healthController.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    version: "v1",
    message: "Help Desk API v1",
    endpoints: {
      health: "/api/v1/health",
      auth: "/api/v1/auth",
      admin: "/api/v1/admin",
      tickets: "/api/v1/tickets",
      director: "/api/v1/director",
    },
  });
});

router.get("/health", getHealth);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/tickets", ticketRoutes);
router.use("/director", directorRoutes);

export default router;
