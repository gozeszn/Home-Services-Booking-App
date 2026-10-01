const path = require("node:path");
const { createHash } = require("node:crypto");
const mongoose = require("mongoose");
const { z } = require("zod");
const Category = require("../src/models/category");
const { escapeRegex } = require("../src/utils/catalogRules");

const CATEGORY_NAMES = ["Cleaning", "Plumbing", "Electrical", "Gardening"];

function validateCategorySeedEnvironment(environment) {
  const result = z.object({
    NODE_ENV: z.literal("development"),
    MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\/\S+$/),
  }).safeParse(environment);
  if (!result.success) {
    throw new Error("Category seeding requires NODE_ENV=development and a valid MONGODB_URI.");
  }
  return result.data;
}

async function seedCategories(environment) {
  validateCategorySeedEnvironment(environment);
  const results = [];
  for (const name of CATEGORY_NAMES) {
    // Stable fixture IDs make concurrent fresh-database runs idempotent.
    const id = new mongoose.Types.ObjectId(
      createHash("sha256").update("home-services/category/" + name.toLowerCase()).digest("hex").slice(0, 24)
    );
    const existing = await Category.findOne({
      $or: [{ _id: id }, { name: { $regex: "^" + escapeRegex(name) + "$", $options: "i" } }],
    });
    if (existing) {
      results.push({ name, outcome: "preserved" });
      continue;
    }
    try {
      const result = await Category.updateOne(
        { _id: id }, { $setOnInsert: { name, status: "active", createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true, runValidators: true, timestamps: false }
      );
      results.push({ name, outcome: result.upsertedCount ? "created" : "preserved" });
    } catch (error) {
      if (error.code !== 11000 || !error.keyPattern?._id) throw error;
      results.push({ name, outcome: "preserved" });
    }
  }
  return results;
}

async function main() {
  require("dotenv").config({ path: path.resolve(__dirname, "../../.env"), quiet: true });
  try {
    const config = validateCategorySeedEnvironment(process.env);
    await mongoose.connect(config.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    for (const result of await seedCategories(config)) {
      console.log(result.outcome + ": " + result.name);
    }
    console.log("Existing categories retain their names and status.");
  } catch (error) {
    console.error("Category seed failed. Check development mode and database connectivity.");
    console.error("Error type:", error.name);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch(() => { console.error("Category seed cleanup failed."); process.exitCode = 1; });
}

module.exports = { seedCategories, validateCategorySeedEnvironment };
