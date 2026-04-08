import { z } from "zod";

const email = z.string().trim().email().max(255);
const password = z.string().min(8).max(72);

export const loginSchema = z.object({
  body: z.object({
    email,
    password,
  }),
  params: z.object({}),
  query: z.object({}),
});

export const refreshSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({}),
});

export const adminMutationSchema = z.object({
  body: z.object({
    email,
    password,
  }),
  params: z.object({}),
  query: z.object({}),
});

export const updateAdminPasswordSchema = z.object({
  body: z.object({
    email,
    newPassword: password,
  }),
  params: z.object({}),
  query: z.object({}),
});

export const deleteAdminSchema = z.object({
  body: z.object({
    email,
  }),
  params: z.object({}),
  query: z.object({}),
});

export const updateDirectorPasswordSchema = z.object({
  body: z.object({
    newPassword: password,
  }),
  params: z.object({}),
  query: z.object({}),
});
