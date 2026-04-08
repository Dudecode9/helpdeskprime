export function getRequestMeta(req) {
  return {
    ip:
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      null,
    userAgent: req.get("user-agent") || null,
  };
}

export function getActorFromRequest(req) {
  if (!req.user) {
    return {};
  }

  return {
    actorUserId: req.user.id,
    actorEmail: req.user.email,
    actorRole: req.user.role,
  };
}
