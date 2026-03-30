import express from "express";
import {
  adminLogin,
  registerAdmin,
  getAdmins,
  changeAdminPassword,
  deleteAdminController
} from "../controllers/adminController.js";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/register", registerAdmin);
router.get("/all", getAdmins);
router.post("/create", registerAdmin); // директор создаёт админа
router.post("/update-password", changeAdminPassword);
router.post("/delete", deleteAdminController); // 🔥 новый маршрут

export default router;
