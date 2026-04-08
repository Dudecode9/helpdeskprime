import { createAuditLog } from "../services/auditLogService.js";
import { getRequestMeta } from "../utils/requestContext.js";

export function validate(schema) {
  return function validateRequest(req, res, next) {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const { ip, userAgent } = getRequestMeta(req);
      void createAuditLog({
        category: "security",
        eventType: "request.validation.failed",
        actorUserId: req.user?.id,
        actorEmail: req.user?.email,
        actorRole: req.user?.role,
        status: "failed",
        message: "Request validation failed",
        ip,
        userAgent,
        metadata: {
          path: req.originalUrl,
          errors: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      }).catch(() => {});
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    req.validated = result.data;
    next();
  };
}
