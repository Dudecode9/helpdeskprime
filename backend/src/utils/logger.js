function writeLog(level, event, payload = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...payload,
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  info(event, payload) {
    writeLog("info", event, payload);
  },
  warn(event, payload) {
    writeLog("warn", event, payload);
  },
  error(event, payload) {
    writeLog("error", event, payload);
  },
};
