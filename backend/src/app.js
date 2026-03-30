import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import adminRoutes from "./routes/adminRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import directorRoutes from "./routes/directorRoutes.js"; // ← добавили

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/admin", adminRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/director", directorRoutes); // ← добавили

app.get("/", (req, res) => {
  res.send("Help Desk API is running");
});

export default app;
