import {
  getCurrentInterfaceSpeed,
  getLatestMetrics,
  getMetricHistory,
  listNetworkInterfaces,
  getNetworkInterfaceByName,
} from "../services/networkMonitorService.js";
import {
  acknowledgeNetworkIncident,
  getAnomalySettings,
  getNetworkIncidentById,
  getNetworkIncidentSummary,
  listActiveNetworkIncidents,
  listNetworkIncidentHistory,
  updateAnomalySettings,
} from "../services/networkIncidentService.js";

export async function fetchNetworkInterfaces(req, res) {
  try {
    const includeLoopback = Boolean(req.validated?.query?.includeLoopback || false);
    const interfaces = await listNetworkInterfaces(includeLoopback);
    return res.json({ success: true, interfaces });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load network interfaces" });
  }
}

export async function fetchNetworkInterface(req, res) {
  try {
    const { interfaceName } = req.validated.params;
    const interfaceInfo = await getNetworkInterfaceByName(interfaceName);

    if (!interfaceInfo) {
      return res.status(404).json({ success: false, message: "Interface not found" });
    }

    return res.json({ success: true, interface: interfaceInfo });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load interface state" });
  }
}

export async function fetchLatestMetrics(req, res) {
  try {
    const { interfaceName, limit } = req.validated.query;
    const metrics = await getLatestMetrics({ interfaceName, limit });
    return res.json({ success: true, metrics });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load latest metrics" });
  }
}

export async function fetchMetricHistory(req, res) {
  try {
    const { interfaceName, from, to, limit } = req.validated.query;
    const history = await getMetricHistory({ interfaceName, from, to, limit });
    return res.json({ success: true, history });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load metric history" });
  }
}

export async function fetchCurrentInterfaceSpeed(req, res) {
  try {
    const { interfaceName } = req.validated.params;
    const speed = await getCurrentInterfaceSpeed(interfaceName);

    if (!speed) {
      return res.status(404).json({ success: false, message: "Interface not found" });
    }

    return res.json({ success: true, speed });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load interface speed" });
  }
}

export async function fetchCurrentAnomalies(req, res) {
  try {
    const incidents = await listActiveNetworkIncidents();
    return res.json({ success: true, anomalies: incidents });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to load active anomalies" });
  }
}

export async function fetchIncidentHistory(req, res) {
  try {
    const incidents = await listNetworkIncidentHistory(req.validated.query);
    return res.json({ success: true, incidents });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to load incident history" });
  }
}

export async function fetchIncidentSummary(req, res) {
  try {
    const summary = await getNetworkIncidentSummary();
    return res.json({ success: true, summary });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to load incident statistics" });
  }
}

export async function fetchIncident(req, res) {
  try {
    const incident = await getNetworkIncidentById(req.validated.params.incidentId);
    if (!incident) return res.status(404).json({ success: false, message: "Incident not found" });
    return res.json({ success: true, incident });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to load incident" });
  }
}

export async function acknowledgeIncident(req, res) {
  try {
    const { incidentId } = req.validated.params;
    const incident = await acknowledgeNetworkIncident(incidentId, req.user?.id ?? null);
    if (incident) return res.json({ success: true, incident });

    const existing = await getNetworkIncidentById(incidentId);
    if (!existing) return res.status(404).json({ success: false, message: "Incident not found" });
    return res.status(409).json({ success: false, message: "Resolved incidents cannot be acknowledged" });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to acknowledge incident" });
  }
}

export async function fetchAnomalySettings(req, res) {
  try {
    const settings = await getAnomalySettings();
    return res.json({ success: true, settings });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to load anomaly settings" });
  }
}

export async function saveAnomalySettings(req, res) {
  try {
    const settings = await updateAnomalySettings(req.validated.body);
    return res.json({ success: true, settings });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to update anomaly settings" });
  }
}
