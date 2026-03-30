import express from "express";
import {
  adminLogin,
  registerAdmin,
  getAdmins,
  changeAdminPassword
} from "../controllers/adminController.js";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/register", registerAdmin);
router.get("/all", getAdmins);
router.post("/create", registerAdmin); // директор создаёт админа
router.post("/update-password", changeAdminPassword);

export default router;
