const { z } = require("zod");

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid identifier");

const bookingStatus = z.enum([
  "pending",
  "accepted",
  "rejected",
  "in_progress",
  "completed",
  "cancelled",
]);

const transitionStatus = z.enum([
  "accepted",
  "rejected",
  "in_progress",
  "completed",
  "cancelled",
]);

const positiveInteger = (maximum) =>
  z
    .string()
    .regex(/^[1-9]\d*$/, "Use a positive integer")
    .transform(Number)
    .pipe(z.number().int().min(1).max(maximum));

const paginationFields = {
  page: positiveInteger(100000).default(1),
  limit: positiveInteger(50).default(10),
};

const isoDateTime = z
  .string()
  .datetime(
    {
      offset: true,
      message: "Use an ISO 8601 date and time with a timezone.",
    }
  );

const createBookingSchema = z
  .object({
    serviceId: objectId,
    scheduledAt: isoDateTime,
    serviceAddress: z.string().trim().min(10).max(300),
    customerNote: z.string().trim().max(1000).default(""),
  })
  .strict();

const bookingStatusSchema = z
  .object({
    status: transitionStatus,
    reason: z.string().trim().max(500).default(""),
  })
  .strict();

const bookingListQuerySchema = z
  .object({
    status: bookingStatus.optional(),
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    ...paginationFields,
  })
  .strict()
  .refine(
    (value) =>
      !value.from ||
      !value.to ||
      new Date(value.from) <= new Date(value.to),
    {
      message: "from must not be after to",
      path: ["from"],
    }
  );

const bookingParamsSchema = z
  .object({
    bookingId: objectId,
  })
  .strict();

const paymentSchema = z
  .object({
    method: z.literal("test").default("test"),
    confirm: z.literal(true, {
      message: "Payment confirmation must be true.",
    }),
  })
  .strict();

module.exports = {
  createBookingSchema,
  bookingStatusSchema,
  bookingListQuerySchema,
  bookingParamsSchema,
  paymentSchema,
};