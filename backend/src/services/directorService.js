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
  return verifyDirectorCredentials(email, password);
}

// 🔥 Смена пароля директора
export async function updateDirectorPassword(newPassword) {
  const hashed = await bcrypt.hash(newPassword, 10);

  const result = await pool.query(
    "UPDATE directordev SET password = $1 WHERE email = $2 RETURNING id, email",
    [hashed, process.env.DIRECTOR_EMAIL]
  );

  return result.rows[0];
}

export async function findDirectorByEmail(email) {
  const result = await pool.query(
    "SELECT id, email, password FROM directordev WHERE email = $1",
    [email]
  );

  return result.rows[0] || null;
}

export async function verifyDirectorCredentials(email, password) {
  const director = await findDirectorByEmail(email);
  if (!director) {
    return null;
  }

  const match = await bcrypt.compare(password, director.password);
  if (!match) {
    return null;
  }

  return { id: director.id, email: director.email };
}
