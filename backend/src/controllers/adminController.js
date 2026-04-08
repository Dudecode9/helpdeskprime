import {
  createAdmin,
  loginAdmin,
  getAllAdmins,
  updateAdminPassword,
  deleteAdmin,
} from "../services/adminService.js";
import { createAuditLog } from "../services/auditLogService.js";
import { getRequestMeta } from "../utils/requestContext.js";

export async function adminLogin(req, res) {
  const { email, password } = req.validated?.body || req.body;

  try {
    const admin = await loginAdmin(email, password);
    res.json({ success: true, admin });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
}

export async function registerAdmin(req, res) {
  const { email, password } = req.validated?.body || req.body;
  const { ip, userAgent } = getRequestMeta(req);

  try {
    const admin = await createAdmin(email, password);
    await createAuditLog({
      category: "audit",
      eventType: "admin.created",
      actorUserId: req.user?.id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      targetType: "admin",
      targetId: String(admin.id),
      status: "success",
      message: `Admin ${admin.email} created`,
      ip,
      userAgent,
    });
    res.json({ success: true, admin });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create admin" });
  }
}

export async function getAdmins(req, res) {
  try {
    const admins = await getAllAdmins();
    res.json({ success: true, admins });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load admins" });
  }
}

export async function changeAdminPassword(req, res) {
  const { email, newPassword } = req.validated?.body || req.body;
  const { ip, userAgent } = getRequestMeta(req);

  try {
    const admin = await updateAdminPassword(email, newPassword);

    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }

    await createAuditLog({
      category: "audit",
      eventType: "admin.password.changed",
      actorUserId: req.user?.id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      targetType: "admin",
      targetId: String(admin.id),
      status: "success",
      message: `Password changed for admin ${admin.email}`,
      ip,
      userAgent,
    });

    res.json({ success: true, admin });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update admin password" });
  }
}

export async function deleteAdminController(req, res) {
  const { email } = req.validated?.body || req.body;
  const { ip, userAgent } = getRequestMeta(req);

  try {
    const deleted = await deleteAdmin(email);

    if (!deleted) {
      return res.json({ success: false, message: "Admin not found" });
    }

    await createAuditLog({
      category: "audit",
      eventType: "admin.deleted",
      actorUserId: req.user?.id,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      targetType: "admin",
      targetId: String(deleted.id),
      status: "success",
      message: `Admin ${deleted.email} deleted`,
      ip,
      userAgent,
    });

    res.json({ success: true, deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete admin" });
  }
}
