import { pool } from "../config/db.js";

export async function getHealth(req, res, next) {
  try {
    await pool.query("SELECT 1");

    return res.json({
      success: true,
      status: "ok",
      version: "v1",
      database: "up",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    error.statusCode = 503;
    error.publicMessage = "Service unavailable";
    return next(error);
  }
}
