import bcrypt from "bcrypt";
import { pool } from "./config/db.js";

async function createAdmin() {
  const email = "admin@gmail.com";
  const password = "123456";

  const hashed = await bcrypt.hash(password, 10);

  await pool.query(
    "INSERT INTO admins (email, password) VALUES ($1, $2)",
    [email, hashed]
  );

  console.log("Admin created!");
}

createAdmin();
