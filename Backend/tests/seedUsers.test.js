const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../src/models/User");
const { seedUsers, validateSeedEnvironment } = require("../scripts/seedUsers");

describe("Development seed accounts", { concurrency: false }, () => {
  let mongo;
  let environment;

  before(async () => {
    mongo = await MongoMemoryServer.create();
    environment = {
      NODE_ENV: "development",
      MONGODB_URI: mongo.getUri("seed_test"),
      SEED_PASSWORD: "SeedTestPassword123!",
    };
    await mongoose.connect(environment.MONGODB_URI);
  });

  after(async () => {
    try { await mongoose.disconnect(); }
    finally { if (mongo) await mongo.stop(); }
  });

  it("refuses production, unspecified mode, and invalid passwords", () => {
    for (const overrides of [
      { NODE_ENV: "production" },
      { NODE_ENV: undefined },
      { SEED_PASSWORD: "short" },
      { SEED_PASSWORD: "a".repeat(73) },
    ]) {
      assert.throws(() => validateSeedEnvironment({ ...environment, ...overrides }));
    }
  });

  it("creates all roles with hashed passwords and preserves accounts on rerun", async () => {
    const first = await seedUsers(environment);
    assert.equal(first.filter((item) => item.outcome === "created").length, 3);
    const admin = await User.findOne({ role: "admin" }).select("+passwordHash");
    assert.ok(await bcrypt.compare(environment.SEED_PASSWORD, admin.passwordHash));
    const originalHash = admin.passwordHash;

    await User.updateOne({ _id: admin._id }, { $set: { role: "customer", status: "inactive" } });
    const second = await seedUsers({ ...environment, SEED_PASSWORD: "AnotherPassword123!" });
    assert.equal(second.filter((item) => item.outcome === "preserved").length, 3);
    assert.equal(await User.countDocuments({}), 3);
    const preserved = await User.findById(admin._id).select("+passwordHash");
    assert.equal(preserved.passwordHash, originalHash);
    assert.equal(preserved.role, "customer");
    assert.equal(preserved.status, "inactive");
  });
});
