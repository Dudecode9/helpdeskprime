import { z } from "zod";

export const auditLogQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
    actorEmail: z.string().trim().max(255).optional(),
    category: z.string().trim().max(50).optional(),
    eventType: z.string().trim().max(100).optional(),
    status: z.string().trim().max(30).optional(),
    dateFrom: z.string().trim().optional(),
    dateTo: z.string().trim().optional(),
  }),
});
