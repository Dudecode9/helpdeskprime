import crypto from "crypto";
import { logger } from "../utils/logger.js";
import { getRequestMeta } from "../utils/requestContext.js";

export function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();
  const requestId = crypto.randomUUID();
  const { ip, userAgent } = getRequestMeta(req);

  req.requestId = requestId;

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    logger.info("http.request", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip,
      userAgent,
      actorEmail: req.user?.email || null,
      actorRole: req.user?.role || null,
    });
  });

  next();
}
