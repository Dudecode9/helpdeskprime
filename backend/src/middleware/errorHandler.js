import { logger } from "../utils/logger.js";

export function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
}

export function errorHandler(err, req, res, next) {
  logger.error("api.unhandled_error", {
    requestId: req.requestId || null,
    method: req.method,
    path: req.originalUrl,
    actorEmail: req.user?.email || null,
    actorRole: req.user?.role || null,
    errorMessage: err?.message || "Unknown error",
    stack: process.env.NODE_ENV === "development" ? err?.stack || null : null,
  });

  if (res.headersSent) {
    return next(err);
  }

  return res.status(err?.statusCode || 500).json({
    success: false,
    message: err?.publicMessage || "Internal server error",
  });
}
