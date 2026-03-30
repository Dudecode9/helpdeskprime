import bcrypt from "bcrypt";
import { pool } from "./config/db.js";

async function createDirector() {
  const email = "director@gmail.com";
  const password = "director123";

  const hashed = await bcrypt.hash(password, 10);

  await pool.query(
    "INSERT INTO directordev (email, password) VALUES ($1, $2)",
    [email, hashed]
  );

  console.log("Director created!");
  process.exit();
}

createDirector();

// node src/createDirector.js