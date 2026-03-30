import bcrypt from "bcrypt";
import { pool } from "./src/config/db.js";

async function createAdmin() {
  const email = "admin@example.com";   // поменяй на свой
  const password = "admin123";         // поменяй на свой

  const hash = await bcrypt.hash(password, 10);

  await pool.query(
    "INSERT INTO admins (email, password) VALUES ($1, $2)",
    [email, hash]
  );

  console.log("Admin created!");
  process.exit();
}

createAdmin();
