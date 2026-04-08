import { createAuditLog } from "../services/auditLogService.js";
import { getRequestMeta } from "../utils/requestContext.js";

export function createRateLimitHandler(message) {
  return (req, res) => {
    const { ip, userAgent } = getRequestMeta(req);

    void createAuditLog({
      category: "security",
      eventType: "security.rate_limit.hit",
      actorUserId: req.user?.id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      status: "failed",
      message,
      ip,
      userAgent,
      metadata: { path: req.originalUrl },
    }).catch(() => {});

    return res.status(429).json({ success: false, message });
  };
}
