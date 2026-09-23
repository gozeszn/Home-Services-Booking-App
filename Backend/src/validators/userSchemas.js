const { z } = require("zod");

const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100).optional(),

    phone: z.string().trim().max(30).optional(),

    location: z.string().trim().max(200).optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update"
  );

module.exports = {
  updateProfileSchema,
};