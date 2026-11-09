import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  isDesktop: true,
  platform: process.platform,
  appVersion: process.versions.app,
  apiBaseUrl: process.env.HELPDESK_API_URL || "http://127.0.0.1:5000",
  quit: () => ipcRenderer.send("app:quit"),
});
