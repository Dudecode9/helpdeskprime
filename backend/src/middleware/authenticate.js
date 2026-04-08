import { accessCookieName } from "../config/auth.js";
import { createAuditLog } from "../services/auditLogService.js";
import { touchUserSession } from "../services/userSessionService.js";
import { getRequestMeta } from "../utils/requestContext.js";
import { verifyAccessToken } from "../utils/tokens.js";

export function authenticate(req, res, next) {
  const token = req.cookies?.[accessCookieName];
  const { ip, userAgent } = getRequestMeta(req);

  if (!token) {
    void createAuditLog({
      category: "security",
      eventType: "auth.access.denied",
      status: "failed",
      message: "Authentication required",
      ip,
      userAgent,
      metadata: { reason: "missing_access_token", path: req.originalUrl },
    }).catch(() => {});
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    req.user = verifyAccessToken(token);
    void touchUserSession(req.user.sessionJti).catch(() => {});
    next();
  } catch {
    void createAuditLog({
      category: "security",
      eventType: "auth.access.denied",
      status: "failed",
      message: "Invalid or expired session",
      ip,
      userAgent,
      metadata: { reason: "invalid_access_token", path: req.originalUrl },
    }).catch(() => {});
    return res.status(401).json({ success: false, message: "Invalid or expired session" });
  }
}
