import { z } from "zod";

const interfaceNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_.:-]+$/)
  .transform((value) => value.trim());

export const listInterfacesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}),
  query: z.object({
    includeLoopback: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  }),
});

export const interfaceNameParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    interfaceName: interfaceNameSchema,
  }),
  query: z.object({}),
});

export const metricsQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}),
  query: z.object({
    interfaceName: interfaceNameSchema.optional(),
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
    limit: z.coerce.number().int().positive().max(1000).optional(),
  }),
});

const incidentTypeSchema = z.enum([
  "interface_down",
  "traffic_spike",
  "high_traffic",
  "packet_errors",
  "packet_drops",
]);

export const incidentHistorySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}),
  query: z.object({
    status: z.enum(["open", "acknowledged", "resolved"]).optional(),
    type: incidentTypeSchema.optional(),
    limit: z.coerce.number().int().positive().max(500).default(100),
    offset: z.coerce.number().int().nonnegative().max(100_000).default(0),
  }),
});

export const incidentIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ incidentId: z.coerce.number().int().positive() }),
  query: z.object({}),
});

export const anomalySettingsSchema = z.object({
  body: z.object({
    trafficSpikeBytesPerSec: z.number().positive().max(1_000_000_000),
    trafficSpikeMultiplier: z.number().min(1.1).max(100),
    highTrafficBytesPerSec: z.number().positive().max(1_000_000_000),
    highTrafficDurationSamples: z.number().int().min(2).max(3600),
    packetErrorDelta: z.number().int().positive().max(1_000_000),
    packetDropDelta: z.number().int().positive().max(1_000_000),
  }),
  params: z.object({}),
  query: z.object({}),
});
