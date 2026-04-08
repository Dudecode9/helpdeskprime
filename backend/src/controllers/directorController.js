import {
  registerDirector,
  loginDirector,
  updateDirectorPassword,
} from "../services/directorService.js";
import { createAuditLog } from "../services/auditLogService.js";
import { getRequestMeta } from "../utils/requestContext.js";

export async function directorRegister(req, res) {
  const { email, password } = req.validated?.body || req.body;
  const { ip, userAgent } = getRequestMeta(req);

  try {
    const director = await registerDirector(email, password);
    await createAuditLog({
      category: "audit",
      eventType: "director.created",
      actorUserId: req.user?.id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      targetType: "director",
      targetId: String(director.id),
      status: "success",
      message: `Director ${director.email} created`,
      ip,
      userAgent,
    });
    res.json({ success: true, director });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to register director" });
  }
}

export async function directorLogin(req, res) {
  const { email, password } = req.validated?.body || req.body;

  try {
    const director = await loginDirector(email, password);
    if (!director) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    res.json({ success: true, director });
  } catch (err) {
    res.status(500).json({ success: false, message: "Login failed" });
  }
}

export async function changeDirectorPassword(req, res) {
  const { newPassword } = req.validated?.body || req.body;
  const { ip, userAgent } = getRequestMeta(req);

  try {
    const director = await updateDirectorPassword(newPassword);

    if (!director) {
      return res.json({ success: false, message: "Director not found" });
    }

    await createAuditLog({
      category: "audit",
      eventType: "director.password.changed",
      actorUserId: req.user?.id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      targetType: "director",
      targetId: String(director.id),
      status: "success",
      message: `Director password changed for ${director.email}`,
      ip,
      userAgent,
    });

    res.json({ success: true, director });
  } catch (err) {
    res.status(500).json({ success: false, message: "Password update failed" });
  }
}
