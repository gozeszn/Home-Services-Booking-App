const { z } = require("zod");
const { objectId } = require("./catalogSchemas");
const { PRICING_UNITS, LEGACY_UNITS, normalizePricingUnit, isValidPrice } = require("../utils/catalogRules");

const fields = {
  title: z.string().trim().min(3).max(100),
  categoryId: objectId,
  description: z.string().trim().min(20).max(1500),
  price: z.number().refine(isValidPrice, "Price must be between 0 and 1,000,000,000 NGN with at most two decimal places"),
  currency: z.literal("NGN").optional(),
  pricingUnit: z.enum([...PRICING_UNITS, ...Object.keys(LEGACY_UNITS)]).transform(normalizePricingUnit),
  serviceArea: z.string().trim().min(2).max(200),
  availabilitySummary: z.string().trim().min(5).max(300),
};

const createServiceSchema = z.object(fields).strict();
const updateServiceSchema = z.object(fields).partial().strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update");
const statusUpdateSchema = z.object({ status: z.enum(["active", "inactive"]) }).strict();

module.exports = { createServiceSchema, updateServiceSchema, statusUpdateSchema };
