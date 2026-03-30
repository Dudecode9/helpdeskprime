import express from "express";
import {
  directorRegister,
  directorLogin,
  changeDirectorPassword
} from "../controllers/directorController.js";

const router = express.Router();

router.post("/register", directorRegister);
router.post("/login", directorLogin);
router.post("/update-password", changeDirectorPassword); // 🔥 новый маршрут

export default router;
