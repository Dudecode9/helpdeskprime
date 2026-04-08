import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import directorRoutes from "./routes/directorRoutes.js";
import { getAllowedOrigins } from "./config/auth.js";
import { getHealth } from "./controllers/healthController.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { verifyOrigin } from "./middleware/verifyOrigin.js";

dotenv.config();

const app = express();
const allowedOrigins = getAllowedOrigins();

app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(requestLogger);
app.use(verifyOrigin);

app.get("/api/health", getHealth);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/director", directorRoutes);

app.get("/", (req, res) => {
  res.send("Help Desk API is running");
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
