const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Category = require("../src/models/category");
const { seedCategories, validateCategorySeedEnvironment } = require("../scripts/seedCategories");

describe("Development category seed", { concurrency: false }, () => {
  let mongo, environment;
  before(async () => {
    mongo = await MongoMemoryServer.create();
    environment = { NODE_ENV: "development", MONGODB_URI: mongo.getUri("category_seed_test") };
    await mongoose.connect(environment.MONGODB_URI);
  });
  beforeEach(async () => { await Category.deleteMany({}); });
  after(async () => {
    try { await mongoose.disconnect(); }
    finally { if (mongo) await mongo.stop(); }
  });

  it("refuses production, missing mode, and invalid connection configuration", () => {
    for (const change of [{ NODE_ENV: "production" }, { NODE_ENV: undefined }, { MONGODB_URI: "invalid" }]) {
      assert.throws(() => validateCategorySeedEnvironment({ ...environment, ...change }));
    }
  });

  it("creates the four categories and preserves existing IDs and inactive status on rerun", async () => {
    const existing = await Category.create({ name: "cleaning", status: "inactive" });
    const first = await seedCategories(environment);
    assert.equal(first.filter((result) => result.outcome === "created").length, 3);
    const second = await seedCategories(environment);
    assert.equal(second.filter((result) => result.outcome === "preserved").length, 4);
    assert.equal(await Category.countDocuments(), 4);
    const preserved = await Category.findById(existing._id);
    assert.equal(preserved.name, "cleaning");
    assert.equal(preserved.status, "inactive");
    assert.equal(preserved.updatedAt.getTime(), existing.updatedAt.getTime());
    const newCategory = await Category.findOne({ name: "Plumbing" });
    assert.ok(newCategory.createdAt instanceof Date);
    assert.ok(newCategory.updatedAt instanceof Date);
  });

  it("does not duplicate categories when fresh seeds run concurrently", async () => {
    await Promise.all([seedCategories(environment), seedCategories(environment)]);
    assert.equal(await Category.countDocuments(), 4);
  });
});
