const {z} = require("zod");

const updateServiceSchema = z
  .object({
    title: z.string().trim().max(100).optional(),
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID").optional(),
    description: z.string().trim().max(200).optional(),
    price: z.number().min(0).optional(),
    pricingUnit: z.enum(["per hour", "per service", "per day"]).optional(),
    serviceArea: z.string().trim().max(200).optional(),
    availabilitySummary: z.string().trim().max(200).optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update"
  );


  module.exports = {
    updateServiceSchema,
  };