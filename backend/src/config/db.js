import pkg from "pg";
import { logger } from "../utils/logger.js";
const { Pool } = pkg;

export const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
});

pool.on("error", (error) => {
  logger.error("db.pool.error", {
    errorMessage: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : null,
  });
});

export async function closePool() {
  await pool.end();
}
