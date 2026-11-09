import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import {
  fetchCurrentInterfaceSpeed,
  fetchAnomalySettings,
  fetchCurrentAnomalies,
  fetchIncident,
  fetchIncidentHistory,
  fetchIncidentSummary,
  fetchLatestMetrics,
  fetchMetricHistory,
  fetchNetworkInterface,
  fetchNetworkInterfaces,
  acknowledgeIncident,
  saveAnomalySettings,
} from "../controllers/networkController.js";
import {
  anomalySettingsSchema,
  incidentHistorySchema,
  incidentIdSchema,
  interfaceNameParamSchema,
  listInterfacesSchema,
  metricsQuerySchema,
} from "../schemas/networkSchemas.js";

const router = express.Router();

if (process.env.ELECTRON_APP !== "true") {
  router.use(authenticate, requireRole("admin", "director"));
}

router.get("/interfaces", validate(listInterfacesSchema), fetchNetworkInterfaces);
router.get("/interfaces/:interfaceName", validate(interfaceNameParamSchema), fetchNetworkInterface);
router.get("/interfaces/:interfaceName/speed", validate(interfaceNameParamSchema), fetchCurrentInterfaceSpeed);
router.get("/metrics/latest", validate(metricsQuerySchema), fetchLatestMetrics);
router.get("/metrics/history", validate(metricsQuerySchema), fetchMetricHistory);
router.get("/anomalies/current", fetchCurrentAnomalies);
router.get("/incidents/summary", fetchIncidentSummary);
router.get("/incidents", validate(incidentHistorySchema), fetchIncidentHistory);
router.get("/incidents/:incidentId", validate(incidentIdSchema), fetchIncident);
router.post("/incidents/:incidentId/acknowledge", validate(incidentIdSchema), acknowledgeIncident);
router.get("/settings", fetchAnomalySettings);
router.patch("/settings", validate(anomalySettingsSchema), saveAnomalySettings);

export default router;
