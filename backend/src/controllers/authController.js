import { refreshCookieName } from "../config/auth.js";
import { clearAuthCookies, setAuthCookies } from "../utils/cookies.js";
import { buildAuthUser, verifyRefreshToken } from "../utils/tokens.js";
import { findAdminByEmail, verifyAdminCredentials } from "../services/adminService.js";
import { findDirectorByEmail, verifyDirectorCredentials } from "../services/directorService.js";
import {
  findActiveRefreshToken,
  issueSession,
  revokeRefreshTokenByJti,
} from "../services/authService.js";
import { createAuditLog } from "../services/auditLogService.js";
import {
  createUserSession,
  endUserSession,
  touchUserSession,
} from "../services/userSessionService.js";
import { getRequestMeta } from "../utils/requestContext.js";

async function loginWithRole(req, res, role) {
  const { email, password } = req.validated.body;
  const { ip, userAgent } = getRequestMeta(req);
  const user =
    role === "admin"
      ? await verifyAdminCredentials(email, password)
      : await verifyDirectorCredentials(email, password);

  if (!user) {
    await createAuditLog({
      category: "auth",
      eventType: "auth.login.failed",
      actorEmail: email,
      actorRole: role,
      status: "failed",
      message: `Failed ${role} login attempt`,
      ip,
      userAgent,
      metadata: { reason: "invalid_credentials" },
    });
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  const authUser = buildAuthUser(user, role);
  const tokens = await issueSession(authUser);
  setAuthCookies(res, tokens);
  await createUserSession({
    sessionJti: tokens.jti,
    user: authUser,
    ip,
    userAgent,
  });
  await createAuditLog({
    category: "auth",
    eventType: "auth.login.success",
    actorUserId: authUser.id,
    actorEmail: authUser.email,
    actorRole: authUser.role,
    status: "success",
    message: `${role} logged in`,
    ip,
    userAgent,
  });

  return res.json({ success: true, user: authUser });
}

export async function loginAdmin(req, res) {
  return loginWithRole(req, res, "admin");
}

export async function loginDirector(req, res) {
  return loginWithRole(req, res, "director");
}

export function getCurrentUser(req, res) {
  return res.json({ success: true, user: req.user });
}

export async function heartbeat(req, res) {
  await touchUserSession(req.user?.sessionJti);
  return res.json({ success: true });
}

export async function refreshSession(req, res) {
  const token = req.cookies?.[refreshCookieName];
  const { ip, userAgent } = getRequestMeta(req);

  if (!token) {
    await createAuditLog({
      category: "auth",
      eventType: "auth.refresh.failed",
      status: "failed",
      message: "Refresh token missing",
      ip,
      userAgent,
      metadata: { reason: "missing_refresh_token" },
    });
    return res.status(401).json({ success: false, message: "Refresh token missing" });
  }

  try {
    const payload = verifyRefreshToken(token);
    const storedToken = await findActiveRefreshToken(payload.jti);

    if (!storedToken) {
      clearAuthCookies(res);
      await createAuditLog({
        category: "security",
        eventType: "auth.refresh.failed",
        actorEmail: payload.email,
        actorRole: payload.role,
        status: "failed",
        message: "Refresh token invalid",
        ip,
        userAgent,
        metadata: { reason: "refresh_token_revoked_or_missing" },
      });
      return res.status(401).json({ success: false, message: "Refresh token invalid" });
    }

    await revokeRefreshTokenByJti(payload.jti);
    await endUserSession(payload.jti);

    const user =
      payload.role === "admin"
        ? await findAdminByEmail(payload.email)
        : await findDirectorByEmail(payload.email);

    if (!user) {
      clearAuthCookies(res);
      await createAuditLog({
        category: "security",
        eventType: "auth.refresh.failed",
        actorEmail: payload.email,
        actorRole: payload.role,
        status: "failed",
        message: "Refresh requested for missing user",
        ip,
        userAgent,
        metadata: { reason: "user_missing" },
      });
      return res.status(401).json({ success: false, message: "User no longer exists" });
    }

    const authUser = buildAuthUser(user, payload.role);
    const tokens = await issueSession(authUser);
    setAuthCookies(res, tokens);
    await createUserSession({
      sessionJti: tokens.jti,
      user: authUser,
      ip,
      userAgent,
    });
    await createAuditLog({
      category: "auth",
      eventType: "auth.refresh.success",
      actorUserId: authUser.id,
      actorEmail: authUser.email,
      actorRole: authUser.role,
      status: "success",
      message: "Session refreshed",
      ip,
      userAgent,
    });

    return res.json({ success: true, user: authUser });
  } catch {
    clearAuthCookies(res);
    await createAuditLog({
      category: "security",
      eventType: "auth.refresh.failed",
      status: "failed",
      message: "Refresh token expired or malformed",
      ip,
      userAgent,
      metadata: { reason: "invalid_refresh_token" },
    });
    return res.status(401).json({ success: false, message: "Refresh token expired" });
  }
}

export async function logout(req, res) {
  const refreshToken = req.cookies?.[refreshCookieName];
  const { ip, userAgent } = getRequestMeta(req);

  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await revokeRefreshTokenByJti(payload.jti);
      await endUserSession(payload.jti);
      await createAuditLog({
        category: "auth",
        eventType: "auth.logout",
        actorUserId: req.user?.id || Number(payload.sub),
        actorEmail: req.user?.email || payload.email,
        actorRole: req.user?.role || payload.role,
        status: "success",
        message: "User logged out",
        ip,
        userAgent,
      });
    } catch {
      // Ignore invalid refresh tokens during logout.
    }
  }

  clearAuthCookies(res);
  return res.json({ success: true });
}
