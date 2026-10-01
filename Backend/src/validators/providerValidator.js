const { z } = require("zod");

const createProviderProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  description: z.string().trim().min(20).max(1500),
  phone: z.string().trim().min(7).max(30),
  serviceArea: z.string().trim().min(2).max(200),
  availabilitySummary: z.string().trim().min(5).max(300),
}).strict();

const updateProviderProfileSchema = createProviderProfileSchema.partial()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update");

module.exports = { createProviderProfileSchema, updateProviderProfileSchema };
