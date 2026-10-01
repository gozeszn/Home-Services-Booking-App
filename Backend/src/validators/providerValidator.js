const { z } = require("zod");

const createProviderProfileSchema = z
  .object({
    displayName: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(500).optional(),
    phone: z.string().trim().max(30).optional(),
    serviceArea: z.string().trim().min(1).optional(),
    availabilitySummary: z.string().trim().max(500).optional(),
  })
  .strict();

module.exports = {
  createProviderProfileSchema
};