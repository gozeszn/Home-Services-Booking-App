const path = require("node:path");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { z } = require("zod");
const User = require("../src/models/User");

const accounts = [
  { fullName: "Development Customer", email: "customer@home-services.test", role: "customer" },
  { fullName: "Development Provider", email: "provider@home-services.test", role: "provider" },
  { fullName: "Development Admin", email: "admin@home-services.test", role: "admin" },
];

function validateSeedEnvironment(environment) {
  const schema = z.object({
    NODE_ENV: z.literal("development"),
    MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\/\S+$/),
    SEED_PASSWORD: z.string().min(12).refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72
    ),
  });
  const result = schema.safeParse(environment);
  if (!result.success) {
    // Do not include environment values in validation errors.
    throw new Error(
      "Seeding requires NODE_ENV=development, a valid MONGODB_URI, and " +
      "SEED_PASSWORD of at least 12 characters and at most 72 UTF-8 bytes."
    );
  }
  return result.data;
}

async function seedUsers(environment) {
  const config = validateSeedEnvironment(environment);
  const results = [];
  await User.init();

  for (const account of accounts) {
    const existing = await User.findOne({ email: account.email });
    if (existing) {
      results.push({ email: account.email, outcome: "preserved", role: existing.role });
      continue;
    }

    const passwordHash = await bcrypt.hash(config.SEED_PASSWORD, 12);
    try {
      await User.create({ ...account, passwordHash, status: "active" });
      results.push({ email: account.email, outcome: "created", role: account.role });
    } catch (error) {
      if (error.code !== 11000 || !error.keyPattern?.email) throw error;
      // Another invocation created this account; never overwrite it.
      results.push({ email: account.email, outcome: "preserved after concurrent creation" });
    }
  }
  return results;
}

async function main() {
  require("dotenv").config({ path: path.resolve(__dirname, "../../.env"), quiet: true });
  try {
    const config = validateSeedEnvironment(process.env);
    await mongoose.connect(config.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    const results = await seedUsers(config);
    for (const result of results) {
      console.log(`${result.outcome}: ${result.email}${result.role ? ` (${result.role})` : ""}`);
    }
    console.log("Existing accounts retain their password, role, and status.");
  } catch (error) {
    console.error("Seed failed. Check development mode, seed password, and database connectivity.");
    console.error("Error type:", error.name);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch(() => {
    console.error("Seed cleanup failed.");
    process.exitCode = 1;
  });
}

module.exports = { seedUsers, validateSeedEnvironment };
