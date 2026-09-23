const path = require("node:path");
const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config({
  path: path.resolve(__dirname, "../../../.env"),
});

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(5000),

  MONGODB_URI: z
    .string()
    .trim()
    .min(1, "MONGODB_URI is required")
    .regex(
      /^mongodb(?:\+srv)?:\/\/\S+$/,
      "MONGODB_URI must be a MongoDB connection string"
    ),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must contain at least 32 characters")
    .refine(
      (value) => value !== "replace_this_with_a_random_secret",
      "Replace the JWT_SECRET placeholder with a generated secret"
    ),

  JWT_EXPIRES_IN: z
    .string()
    .regex(/^[1-9]\d*[smhd]$/, "Use a duration such as 30m, 1h, or 7d")
    .default("1h"),
  
  CLIENT_ORIGIN: z
    .string()
    .url("CLIENT_ORIGIN must be a valid URL")
    .refine((value) => {
      const url = new URL(value);

      return (
        ["http:", "https:"].includes(url.protocol) &&
        value === url.origin
      );
    }, "CLIENT_ORIGIN must contain only the origin, such as http://localhost:5173"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const errors = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${errors}`);
}

module.exports = result.data;