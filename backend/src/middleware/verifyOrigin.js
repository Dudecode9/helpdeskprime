import { getAllowedOrigins } from "../config/auth.js";
import { createAuditLog } from "../services/auditLogService.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function verifyOrigin(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const origin = req.headers.origin;
  if (!origin) {
    return next();
  }

  const allowedOrigins = getAllowedOrigins();
  if (!allowedOrigins.includes(origin)) {
    void createAuditLog({
      category: "security",
      eventType: "security.origin.blocked",
      status: "failed",
      message: "Blocked request from disallowed origin",
      ip: req.socket?.remoteAddress || null,
      userAgent: req.get("user-agent") || null,
      metadata: { origin, path: req.originalUrl },
    }).catch(() => {});
    return res.status(403).json({ success: false, message: "Origin not allowed" });
  }

  next();
}
