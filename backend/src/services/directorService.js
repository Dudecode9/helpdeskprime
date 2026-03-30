import { pool } from "../config/db.js";
import bcrypt from "bcrypt";

// Регистрация директора
export async function registerDirector(email, password) {
  const hashed = await bcrypt.hash(password, 10);

  const result = await pool.query(
    "INSERT INTO directordev (email, password) VALUES ($1, $2) RETURNING *",
    [email, hashed]
  );

  return result.rows[0];
}

// Логин директора
export async function loginDirector(email, password) {
  const result = await pool.query(
    "SELECT * FROM directordev WHERE email = $1",
    [email]
  );

  const director = result.rows[0];
  if (!director) return null;

  const match = await bcrypt.compare(password, director.password);
  if (!match) return null;

  return director;
}
