import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const backendDir = path.join(projectRoot, "backend");
const frontendDir = path.join(projectRoot, "frontend");
const frontendDistDir = path.join(frontendDir, "dist");
const backendEntry = path.join(backendDir, "server.js");
const frontendEntry = path.join(frontendDir, "package.json");
const isDev = process.env.ELECTRON_IS_DEV === "true";

let mainWindow = null;
let backendProcess = null;
let frontendProcess = null;
let frontendServer = null;

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values = {};
  const content = fs.readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (!match) {
      continue;
    }

    const key = match[1].trim();
    const value = match[2].trim();
    values[key] = value;
  }

  return values;
}

function getRuntimeEnv(frontendOrigin = null) {
  const localEnv = readEnvFile(path.join(projectRoot, ".env"));
  const baseEnv = { ...localEnv, ...process.env };
  const databaseHost = baseEnv.DB_HOST === "postgres" ? "127.0.0.1" : baseEnv.DB_HOST;
  const allowedOrigins = (baseEnv.FRONTEND_URLS || baseEnv.FRONTEND_URL || "http://localhost:5173,http://localhost")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (frontendOrigin && !allowedOrigins.includes(frontendOrigin)) allowedOrigins.push(frontendOrigin);

  return {
    ...baseEnv,
    ...(databaseHost ? { DB_HOST: databaseHost } : {}),
    FRONTEND_URLS: allowedOrigins.join(","),
    NODE_ENV: baseEnv.NODE_ENV || "development",
    PORT: String(baseEnv.PORT || 5000),
    HOST: "127.0.0.1",
    ELECTRON_APP: "true",
  };
}

function waitForHttp(url, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const check = () => {
      fetch(url)
        .then((response) => {
          if (response.ok) {
            resolve();
            return;
          }

          throw new Error(`HTTP ${response.status}`);
        })
        .catch(() => {
          if (Date.now() - startedAt >= timeoutMs) {
            reject(new Error(`Timed out waiting for ${url}`));
            return;
          }

          setTimeout(check, 750);
        });
    };

    check();
  });
}

function shutdownProcess(childProcess) {
  if (!childProcess || childProcess.killed) {
    return;
  }

  childProcess.kill("SIGTERM");
}

function stopProcesses() {
  shutdownProcess(backendProcess);
  shutdownProcess(frontendProcess);
  if (frontendServer) {
    frontendServer.close();
    frontendServer = null;
  }
}

function startBackend(runtimeEnv) {
  const backend = spawn(process.execPath, [backendEntry], {
    cwd: backendDir,
    env: runtimeEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });

  backend.stdout.on("data", (chunk) => {
    console.log(`[backend] ${chunk.toString().trim()}`);
  });

  backend.stderr.on("data", (chunk) => {
    console.error(`[backend-error] ${chunk.toString().trim()}`);
  });

  backend.on("exit", (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`[backend] exited with code ${code} signal ${signal}`);
    }
  });

  return backend;
}

function startFrontendDevServer(runtimeEnv) {
  const frontend = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"], {
    cwd: frontendDir,
    env: {
      ...runtimeEnv,
      BROWSER: "none",
      VITE_API_URL: "http://127.0.0.1:5000",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  frontend.stdout.on("data", (chunk) => {
    console.log(`[frontend] ${chunk.toString().trim()}`);
  });

  frontend.stderr.on("data", (chunk) => {
    console.error(`[frontend-error] ${chunk.toString().trim()}`);
  });

  return frontend;
}

function startBuiltFrontendServer(apiPort) {
  return new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405, { Allow: "GET, HEAD" }).end();
        return;
      }

      let pathname;
      try {
        pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
      } catch {
        response.writeHead(400).end();
        return;
      }

      let filePath = path.resolve(frontendDistDir, `.${pathname}`);
      if (filePath !== frontendDistDir && !filePath.startsWith(`${frontendDistDir}${path.sep}`)) {
        response.writeHead(403).end();
        return;
      }

      try {
        if (!fs.statSync(filePath).isFile()) filePath = path.join(frontendDistDir, "index.html");
      } catch {
        if (path.extname(pathname)) {
          response.writeHead(404).end();
          return;
        }
        filePath = path.join(frontendDistDir, "index.html");
      }

      const contentTypes = {
        ".css": "text/css; charset=utf-8",
        ".html": "text/html; charset=utf-8",
        ".ico": "image/x-icon",
        ".js": "text/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".png": "image/png",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
      };
      response.setHeader("Content-Type", contentTypes[path.extname(filePath)] || "application/octet-stream");
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.setHeader(
        "Content-Security-Policy",
        `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' http://127.0.0.1:${apiPort}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`
      );
      if (request.method === "HEAD") {
        response.end();
        return;
      }
      fs.createReadStream(filePath).pipe(response);
    });

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.removeListener("error", reject);
      frontendServer = server;
      resolve({ url: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    show: false,
    backgroundColor: "#0f172a",
    autoHideMenuBar: true,
    title: "HelpdeskPrime Desktop",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function loadApp(baseRuntimeEnv) {
  const backendUrl = `http://127.0.0.1:${baseRuntimeEnv.PORT}/api/health`;

  if (isDev) {
    const frontendOrigin = "http://127.0.0.1:5173";
    const runtimeEnv = getRuntimeEnv(frontendOrigin);
    backendProcess = startBackend(runtimeEnv);
    await waitForHttp(backendUrl, 30000);

    frontendProcess = startFrontendDevServer(runtimeEnv);
    await waitForHttp("http://127.0.0.1:5173", 30000);
    await mainWindow.loadURL("http://127.0.0.1:5173");
    return;
  }

  const indexPath = path.join(frontendDistDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    dialog.showErrorBox(
      "Frontend build required",
      "Run npm --prefix frontend run build before launching the desktop app."
    );
    app.exit(1);
    return;
  }

  const frontend = await startBuiltFrontendServer(baseRuntimeEnv.PORT);
  backendProcess = startBackend(getRuntimeEnv(frontend.url));
  await waitForHttp(backendUrl, 30000);
  await waitForHttp(frontend.url, 10000);
  await mainWindow.loadURL(frontend.url);
}

app.whenReady().then(async () => {
  const runtimeEnv = getRuntimeEnv();
  process.env.HELPDESK_API_URL = `http://127.0.0.1:${runtimeEnv.PORT}`;
  createWindow();

  try {
    await loadApp(runtimeEnv);
  } catch (error) {
    console.error("Failed to start desktop app", error);
    dialog.showErrorBox(
      "Application startup failed",
      error?.message || "Unknown launch error"
    );
    app.exit(1);
  }
});

app.on("before-quit", () => {
  stopProcesses();
});

app.on("window-all-closed", () => {
  stopProcesses();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on("app:quit", () => {
  app.quit();
});
