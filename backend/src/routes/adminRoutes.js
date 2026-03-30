import express from "express";
import { registerAdmin } from "../controllers/adminController.js";
import { adminLogin } from "../controllers/adminController.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", adminLogin);

export default router;
