const { z } = require("zod");

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid identifier.");

const positiveInteger = (maximum) =>
  z
    .string()
    .regex(/^[1-9]\d*$/, "Use a positive integer.")
    .transform(Number)
    .pipe(z.number().int().min(1).max(maximum));

const paginationFields = {
  page: positiveInteger(100000).default(1),
  limit: positiveInteger(50).default(10),
};

const reviewParamsSchema = z
  .object({
    reviewId: objectId,
  })
  .strict();

const bookingReviewParamsSchema = z
  .object({
    bookingId: objectId,
  })
  .strict();

const serviceReviewParamsSchema = z
  .object({
    serviceId: objectId,
  })
  .strict();

const createReviewSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(1000).default(""),
  })
  .strict();

const reviewListQuerySchema = z
  .object({
    ...paginationFields,
  })
  .strict();

const adminReviewListQuerySchema = z
  .object({
    status: z.enum(["published", "hidden"]).optional(),
    ...paginationFields,
  })
  .strict();

const moderationSchema = z
  .object({
    status: z.enum(["published", "hidden"]),
    reason: z.string().trim().max(500).default(""),
  })
  .strict();

module.exports = {
  reviewParamsSchema,
  bookingReviewParamsSchema,
  serviceReviewParamsSchema,
  createReviewSchema,
  reviewListQuerySchema,
  adminReviewListQuerySchema,
  moderationSchema,
};