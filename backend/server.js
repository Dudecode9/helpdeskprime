import app from "./src/app.js";
import { closePool } from "./src/config/db.js";
import { logger } from "./src/utils/logger.js";

const PORT = Number(process.env.PORT || 5000);
const SHUTDOWN_TIMEOUT_MS = 10_000;

const server = app.listen(PORT, () => {
  logger.info("server.started", {
    port: PORT,
    nodeEnv: process.env.NODE_ENV || "development",
  });
});

let isShuttingDown = false;

async function shutdown(signal, error = null) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  logger.info("server.shutdown.started", {
    signal,
    hasError: Boolean(error),
    errorMessage: error?.message || null,
  });

  const forcedShutdown = setTimeout(() => {
    logger.error("server.shutdown.timeout", {
      signal,
      timeoutMs: SHUTDOWN_TIMEOUT_MS,
    });
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    await new Promise((resolve, reject) => {
      server.close((closeError) => {
        if (closeError) {
          reject(closeError);
          return;
        }

        resolve();
      });
    });

    await closePool();

    clearTimeout(forcedShutdown);
    logger.info("server.shutdown.completed", { signal });
    process.exit(error ? 1 : 0);
  } catch (shutdownError) {
    clearTimeout(forcedShutdown);
    logger.error("server.shutdown.failed", {
      signal,
      errorMessage: shutdownError.message,
      stack: process.env.NODE_ENV === "development" ? shutdownError.stack : null,
    });
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("uncaughtException", (error) => {
  logger.error("process.uncaught_exception", {
    errorMessage: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : null,
  });
  void shutdown("uncaughtException", error);
});

process.on("unhandledRejection", (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logger.error("process.unhandled_rejection", {
    errorMessage: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : null,
  });
  void shutdown("unhandledRejection", error);
});
