import {
  getDirectorDashboardLogs,
  getDirectorOnlineUsers,
} from "../services/directorMonitorService.js";

export async function getOnlineUsers(req, res) {
  try {
    const users = await getDirectorOnlineUsers();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load online users" });
  }
}

export async function getAuditTrail(req, res) {
  try {
    const logs = await getDirectorDashboardLogs(req.query);
    res.json({ success: true, ...logs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load audit logs" });
  }
}
