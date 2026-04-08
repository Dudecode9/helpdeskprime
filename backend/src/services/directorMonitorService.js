import { listRecentAuditLogs } from "./auditLogService.js";
import { listOnlineUsers } from "./userSessionService.js";

export async function getDirectorDashboardLogs(filters = {}) {
  return listRecentAuditLogs(filters);
}

export async function getDirectorOnlineUsers() {
  return listOnlineUsers(3);
}
