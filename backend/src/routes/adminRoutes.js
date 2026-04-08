import express from "express";
import {
  registerAdmin,
  getAdmins,
  changeAdminPassword,
  deleteAdminController,
} from "../controllers/adminController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import {
  adminMutationSchema,
  deleteAdminSchema,
  updateAdminPasswordSchema,
} from "../schemas/authSchemas.js";

const router = express.Router();

router.use(authenticate, requireRole("director"));

router.post("/register", validate(adminMutationSchema), registerAdmin);
router.get("/all", getAdmins);
router.post("/create", validate(adminMutationSchema), registerAdmin);
router.post("/update-password", validate(updateAdminPasswordSchema), changeAdminPassword);
router.post("/delete", validate(deleteAdminSchema), deleteAdminController);

export default router;
