import { z } from "zod";

export const submitTicketSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(255),
    phone: z.string().trim().min(5).max(30),
    message: z.string().trim().min(10).max(1000),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const ticketIdSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}),
});

export const ticketListQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
    email: z.string().trim().max(255).optional(),
    dateFrom: z.string().trim().optional(),
    dateTo: z.string().trim().optional(),
  }),
});
