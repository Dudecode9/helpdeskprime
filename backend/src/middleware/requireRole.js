import { createAuditLog } from "../services/auditLogService.js";
import { getRequestMeta } from "../utils/requestContext.js";

export function requireRole(...roles) {
  return function roleMiddleware(req, res, next) {
    const { ip, userAgent } = getRequestMeta(req);

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      void createAuditLog({
        category: "security",
        eventType: "auth.role.forbidden",
        actorUserId: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        status: "failed",
        message: "User attempted to access a forbidden role-protected resource",
        ip,
        userAgent,
        metadata: { path: req.originalUrl, allowedRoles: roles },
      }).catch(() => {});
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    next();
  };
}
