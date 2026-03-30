import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  user: "postgres",
  password: "03011",
  host: "localhost",
  port: 5432,
  database: "helpde",
});
