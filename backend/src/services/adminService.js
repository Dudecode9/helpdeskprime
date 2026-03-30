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
  const result = await pool.query(
    "SELECT * FROM admins WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error("Admin not found");
  }

  const admin = result.rows[0];

  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) {
    throw new Error("Invalid password");
  }

  return { id: admin.id, email: admin.email };
}

// Получить всех админов
export async function getAllAdmins() {
  const result = await pool.query(
    "SELECT id, email FROM admins ORDER BY id ASC"
  );
  return result.rows;
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
