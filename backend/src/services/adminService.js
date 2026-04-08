import bcrypt from "bcrypt";
import { pool } from "../config/db.js";

// Создание нового администратора
export async function createAdmin(email, password) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const query = `
    INSERT INTO admins (email, password)
    VALUES ($1, $2)
    RETURNING id, email;
  `;

  const result = await pool.query(query, [email, hashedPassword]);
  return result.rows[0];
}

// Авторизация администратора
export async function loginAdmin(email, password) {
  const admin = await verifyAdminCredentials(email, password);

  if (!admin) {
    throw new Error("Invalid email or password");
  }

  return admin;
}

// Получить всех админов
export async function getAllAdmins() {
  const result = await pool.query(
    "SELECT id, email FROM admins ORDER BY id ASC"
  );
  return result.rows;
}

export async function findAdminByEmail(email) {
  const result = await pool.query(
    "SELECT id, email, password FROM admins WHERE email = $1",
    [email]
  );

  return result.rows[0] || null;
}

export async function verifyAdminCredentials(email, password) {
  const admin = await findAdminByEmail(email);
  if (!admin) {
    return null;
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    return null;
  }

  return { id: admin.id, email: admin.email };
}

// Обновить пароль админа
export async function updateAdminPassword(email, newPassword) {
  const hashed = await bcrypt.hash(newPassword, 10);

  const result = await pool.query(
    "UPDATE admins SET password = $1 WHERE email = $2 RETURNING id, email",
    [hashed, email]
  );

  return result.rows[0];
}

// 🔥 Удалить администратора
export async function deleteAdmin(email) {
  const result = await pool.query(
    "DELETE FROM admins WHERE email = $1 RETURNING id, email",
    [email]
  );

  return result.rows[0];
}
