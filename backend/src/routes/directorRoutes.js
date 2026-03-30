import express from "express";
import { directorRegister, directorLogin } from "../controllers/directorController.js";

const router = express.Router();

router.post("/register", directorRegister);
router.post("/login", directorLogin);

export default router;
