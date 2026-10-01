const {z} = require("zod");

const createServiceSchema = z
  .object({
    title: z.string().trim().min(1).max(100),

    categoryId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID"),

    description: z.string().trim().min(1).max(200),

    price: z.number().min(0),

    pricingUnit: z.enum(["per hour", "per service", "per day"]),

    serviceArea: z.string().trim().min(1).max(200),

    availabilitySummary: z.string().trim().min(1).max(200),
  })
  .strict();


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

  
const statusUpdateSchema = z
  .object({
    status: z.enum(["active", "inactive"])
  })
  .strict();



  module.exports = {
    createServiceSchema,
    updateServiceSchema,
    statusUpdateSchema
  };