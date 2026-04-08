import express from "express";
import {
  directorRegister,
  changeDirectorPassword,
} from "../controllers/directorController.js";
import {
  getAuditTrail,
  getOnlineUsers,
} from "../controllers/monitorController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import {
  adminMutationSchema,
  updateDirectorPasswordSchema,
} from "../schemas/authSchemas.js";
import { auditLogQuerySchema } from "../schemas/monitorSchemas.js";

const router = express.Router();

router.use(authenticate, requireRole("director"));

router.post("/register", validate(adminMutationSchema), directorRegister);
router.post("/update-password", validate(updateDirectorPasswordSchema), changeDirectorPassword);
router.get("/online-users", getOnlineUsers);
router.get("/audit-logs", validate(auditLogQuerySchema), getAuditTrail);

export default router;
