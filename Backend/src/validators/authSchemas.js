const { z } = require("zod");

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),

    email: z.string().trim().toLowerCase().email().max(254),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= 72,
        "Password must not exceed 72 UTF-8 bytes"
      ),

    role: z.enum(["customer", "provider"]),
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),

    password: z
      .string()
      .min(1, "Password is required")
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= 72,
        "Password must not exceed 72 UTF-8 bytes"
      ),
  })
  .strict();

module.exports = {
  registerSchema,
  loginSchema,
};