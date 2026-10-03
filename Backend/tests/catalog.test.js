const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

describe("Member Two provider and service API", { concurrency: false }, () => {
  let mongo, app, User, Provider, Service, Category, users, tokens, categories, profiles;
  const profileInput = {
    displayName: "Fresh Space", description: "Residential cleaning and maintenance services.",
    phone: "08012345678", serviceArea: "Lagos", availabilitySummary: "Weekdays 9am to 5pm",
  };
  let serviceInput;

  function api(method, route, who) {
    const call = request(app)[method]("/api/v1" + route);
    return who ? call.auth(tokens[who], { type: "bearer" }) : call;
  }
  async function create(overrides = {}, who = "a", active = true) {
    const response = await api("post", "/services", who).send({ ...serviceInput, ...overrides }).expect(201);
    if (!active) return response.body.data;
    const published = await api("patch", "/services/" + response.body.data.id + "/status", who)
      .send({ status: "active" }).expect(200);
    return published.body.data;
  }
  function assertSafe(value) {
    const json = JSON.stringify(value);
    for (const key of ['"passwordHash"', '"email"', '"__v"', '"_id"']) {
      assert.equal(json.includes(key), false, "Unexpected private/internal field " + key);
    }
  }

  before(async () => {
    mongo = await MongoMemoryServer.create();
    Object.assign(process.env, {
      NODE_ENV: "test", PORT: "5000", MONGODB_URI: mongo.getUri("catalog_test"),
      JWT_SECRET: randomBytes(48).toString("hex"), JWT_EXPIRES_IN: "1h",
      CLIENT_ORIGIN: "http://localhost:5173",
    });
    app = require("../src/app");
    User = require("../src/models/User");
    Provider = require("../src/models/serviceProvider");
    Service = require("../src/models/services");
    Category = require("../src/models/category");
    await mongoose.connect(process.env.MONGODB_URI);
    await Promise.all([User.init(), Provider.init(), Service.init(), Category.init()]);
  });

  beforeEach(async () => {
    await Promise.all([User.deleteMany({}), Provider.deleteMany({}), Service.deleteMany({}), Category.deleteMany({})]);
    users = {};
    tokens = {};
    for (const [key, role] of [["a", "provider"], ["b", "provider"], ["customer", "customer"], ["admin", "admin"]]) {
      users[key] = await User.create({
        fullName: "Test " + key, email: key + "@example.test", passwordHash: "unused-test-hash", role,
      });
      tokens[key] = jwt.sign({ role }, process.env.JWT_SECRET, {
        subject: String(users[key]._id), algorithm: "HS256", expiresIn: "1h",
      });
    }
    profiles = {
      a: await Provider.create({ ...profileInput, user: users.a._id }),
      b: await Provider.create({ ...profileInput, displayName: "Another Provider", user: users.b._id }),
    };
    categories = await Category.create([
      { name: "Cleaning" }, { name: "Plumbing" }, { name: "Gardening", status: "inactive" },
    ]);
    serviceInput = {
      title: "Home cleaning", description: "General household cleaning service.",
      categoryId: String(categories[0]._id), price: 15000, currency: "NGN",
      pricingUnit: "visit", serviceArea: "Lagos", availabilitySummary: "Available on weekdays",
    };
  });

  after(async () => {
    try { await mongoose.disconnect(); }
    finally { if (mongo) await mongo.stop(); }
  });

  it("returns active categories with stable IDs and literal name search", async () => {
    const all = await api("get", "/categories").expect(200);
    assert.deepEqual(all.body.data.map((item) => item.name), ["Cleaning", "Plumbing"]);
    assert.match(all.body.data[0].id, /^[a-f0-9]{24}$/);
    const search = await api("get", "/categories").query({ q: "clean" }).expect(200);
    assert.equal(search.body.data.length, 1);
    const literal = await api("get", "/categories").query({ q: "[" }).expect(200);
    assert.deepEqual(literal.body.data, []);
    await api("get", "/categories?q=a&q=b").expect(400);
  });

  it("returns an explicit empty onboarding state and creates/updates only the caller profile", async () => {
    await Provider.deleteOne({ _id: profiles.a._id });
    const empty = await api("get", "/providers/me", "a").expect(200);
    assert.equal(empty.body.data, null);
    const listing = await api("get", "/providers/me/services", "a").expect(200);
    assert.deepEqual(listing.body.data.services, []);
    assert.deepEqual(listing.body.data.meta, { page: 1, limit: 10, totalItems: 0, totalPages: 0 });
    const incomplete = await api("patch", "/providers/me", "a").send({ displayName: "New provider" }).expect(400);
    assert.ok(incomplete.body.error.details.some((item) => item.field === "body.phone"));
    const created = await api("patch", "/providers/me", "a").send(profileInput).expect(200);
    assert.equal(created.body.data.userId, String(users.a._id));
    const updated = await api("patch", "/providers/me", "a").send({ displayName: "Updated provider" }).expect(200);
    assert.equal(updated.body.data.id, created.body.data.id);
    assert.equal(updated.body.data.phone, profileInput.phone);
    assert.equal(await Provider.countDocuments({ user: users.a._id }), 1);
    assert.equal((await Provider.findById(profiles.b._id)).displayName, "Another Provider");
    assertSafe(updated.body);
  });

  it("rejects empty, forged, oversized, and blank provider updates", async () => {
    for (const body of [
      {}, { user: String(users.b._id) }, { rating: 5 }, { status: "inactive" },
      { phone: "" }, { serviceArea: " " }, { description: "x".repeat(1501) },
      { availabilitySummary: "x".repeat(301) },
    ]) {
      const result = await api("patch", "/providers/me", "a").send(body).expect(400);
      assert.equal(result.body.error.code, "VALIDATION_ERROR");
    }
    await api("patch", "/providers/me", "a").send({ description: "x".repeat(1500) }).expect(200);
  });

  it("enforces the unique profile constraint during simultaneous onboarding", async () => {
    await Provider.deleteOne({ _id: profiles.a._id });
    const responses = await Promise.all([
      api("patch", "/providers/me", "a").send(profileInput),
      api("patch", "/providers/me", "a").send(profileInput),
    ]);
    assert.ok(responses.every((response) => [200, 409].includes(response.status)));
    assert.ok(responses.some((response) => response.status === 200));
    assert.equal(await Provider.countDocuments({ user: users.a._id }), 1);
  });

  it("requires authentication and a current provider role for every owner endpoint", async () => {
    const service = await create();
    const endpoints = [
      ["get", "/providers/me"], ["patch", "/providers/me", profileInput],
      ["get", "/providers/me/services"], ["post", "/services", serviceInput],
      ["patch", "/services/" + service.id, { title: "Updated title" }],
      ["patch", "/services/" + service.id + "/status", { status: "inactive" }],
    ];
    for (const [method, route, body] of endpoints) {
      for (const [who, expected] of [[undefined, 401], ["customer", 403], ["admin", 403]]) {
        const call = api(method, route, who);
        if (body) call.send(body);
        await call.expect(expected);
      }
    }
    await User.updateOne({ _id: users.a._id }, { $set: { status: "inactive" } });
    await api("patch", "/providers/me", "a").send({ displayName: "Blocked" }).expect(403);
  });

  it("creates inactive services with canonical frontend fields and publishes explicitly", async () => {
    const service = await create({}, "a", false);
    assert.equal(service.status, "inactive");
    assert.equal(service.currency, "NGN");
    assert.equal(service.location, "Lagos");
    assert.equal(service.serviceArea, "Lagos");
    assert.equal(service.provider.id, String(profiles.a._id));
    assert.equal(service.provider.displayName, profileInput.displayName);
    assert.equal(service.categoryName, "Cleaning");
    assert.equal(service.pricingUnit, "visit");
    assert.deepEqual(service.ratingSummary, { available: true, averageRating: null, ratingCount: 0 });
    await api("get", "/services/" + service.id).expect(404);
    await api("patch", "/services/" + service.id + "/status", "a").send({ status: "active" }).expect(200);
    const detail = await api("get", "/services/" + service.id).expect(200);
    assertSafe(detail.body);
  });

  it("requires a provider profile and an active existing category", async () => {
    await api("post", "/services", "a").send({ ...serviceInput, categoryId: String(categories[2]._id) }).expect(404);
    await api("post", "/services", "a").send({ ...serviceInput, categoryId: String(new mongoose.Types.ObjectId()) }).expect(404);
    await Provider.deleteOne({ _id: profiles.a._id });
    await api("post", "/services", "a").send(serviceInput).expect(404);
  });

  it("validates service bodies, IDs, currency, and monetary precision", async () => {
    for (const overrides of [
      { price: -1 }, { price: 1.001 }, { price: 0.000000001 }, { price: 1000000001 },
      { price: "15000" }, { currency: "USD" }, { pricingUnit: "month" },
      { categoryId: "cleaning" }, { description: "short" }, { description: "x".repeat(1501) },
      { title: " " }, { serviceArea: "" }, { availabilitySummary: "x".repeat(301) },
      { provider: String(profiles.b._id) }, { status: "active" }, { rating: 5 },
    ]) {
      await api("post", "/services", "a").send({ ...serviceInput, ...overrides }).expect(400);
    }
    await create({ price: 0, description: "x".repeat(1500) }, "a", false);
    await create({ price: 19.99 }, "a", false);
    await create({ price: 1000000000 }, "a", false);
    for (const [method, route, body] of [
      ["get", "/services/not-an-id"],
      ["get", "/providers/not-an-id"],
      ["patch", "/services/not-an-id", { title: "Updated title" }],
      ["patch", "/services/not-an-id/status", { status: "active" }],
    ]) {
      const call = api(method, route, method === "patch" ? "a" : undefined);
      if (body) call.send(body);
      const response = await call.expect(400);
      assert.equal(response.body.error.code, "VALIDATION_ERROR");
    }
  });

  it("normalizes legacy units and supports updates to existing legacy records", async () => {
    for (const [input, expected] of [
      ["per hour", "hour"], ["per service", "job"], ["per day", "day"],
      ["visit", "visit"], ["hour", "hour"], ["job", "job"], ["day", "day"],
    ]) {
      assert.equal((await create({ pricingUnit: input }, "a", false)).pricingUnit, expected);
    }
    const service = await create();
    await Service.collection.updateOne({ _id: new mongoose.Types.ObjectId(service.id) }, {
      $set: { pricingUnit: "per day", description: "Legacy short text" }, $unset: { currency: "" },
    });
    const updated = await api("patch", "/services/" + service.id, "a").send({ title: "Renamed legacy service" }).expect(200);
    assert.equal(updated.body.data.pricingUnit, "day");
    assert.equal(updated.body.data.currency, "NGN");
  });

  it("rejects cross-provider edits/status changes and preserves unspecified fields", async () => {
    const service = await create();
    await api("patch", "/services/" + service.id, "b").send({ title: "Stolen listing" }).expect(404);
    await api("patch", "/services/" + service.id + "/status", "b").send({ status: "inactive" }).expect(404);
    for (const body of [{}, { title: "" }, { providerId: String(profiles.b._id) }, { status: "inactive" }]) {
      await api("patch", "/services/" + service.id, "a").send(body).expect(400);
    }
    await api("patch", "/services/" + service.id + "/status", "a").send({ status: "deleted" }).expect(400);
    const updated = await api("patch", "/services/" + service.id, "a").send({ title: "Updated cleaning" }).expect(200);
    assert.equal(updated.body.data.price, service.price);
    assert.equal(updated.body.data.status, "active");
    const other = await api("get", "/providers/me/services", "b").expect(200);
    assert.equal(other.body.data.meta.totalItems, 0);
  });

  it("supports discovery search, category/location/price filters and deterministic sorting", async () => {
    await create({ title: "Zulu cleaning", price: 200 });
    await create({ title: "Alpha plumbing", categoryId: String(categories[1]._id), serviceArea: "Abuja", price: 100 }, "b");
    const byProvider = await api("get", "/services").query({ q: "Another Provider" }).expect(200);
    assert.equal(byProvider.body.data.services[0].title, "Alpha plumbing");
    const byDescription = await api("get", "/services").query({ q: "household" }).expect(200);
    assert.equal(byDescription.body.data.meta.totalItems, 2);
    const filtered = await api("get", "/services").query({
      category: String(categories[0]._id), location: "lag", minPrice: "150", maxPrice: "200",
    }).expect(200);
    assert.equal(filtered.body.data.services[0].title, "Zulu cleaning");
    for (const sort of ["price-desc", "price_desc"]) {
      const result = await api("get", "/services").query({ sort }).expect(200);
      assert.deepEqual(result.body.data.services.map((service) => service.price), [200, 100]);
    }
    const asc = await api("get", "/services").query({ sort: "price-asc" }).expect(200);
    assert.deepEqual(asc.body.data.services.map((service) => service.price), [100, 200]);
    const newest = await api("get", "/services").query({ sort: "newest" }).expect(200);
    assert.equal(newest.body.data.services[0].title, "Alpha plumbing");
  });

  it("treats regex characters as literal search and location text", async () => {
    await create({ title: "Cleaning [special]", serviceArea: "Lagos [Island]" });
    await create({ title: "Other cleaning" });
    for (const query of [{ q: "[" }, { location: "[" }]) {
      const result = await api("get", "/services").query(query).expect(200);
      assert.equal(result.body.data.services.length, 1);
    }
    const regex = await api("get", "/services").query({ q: ".*" }).expect(200);
    assert.equal(regex.body.data.services.length, 0);
  });

  it("rejects malformed and unbounded collection queries with 400 rather than 500", async () => {
    for (const route of ["/services", "/providers/me/services", "/providers/" + profiles.a._id]) {
      for (const query of ["page=-1", "page=0", "page=1.2", "page=no", "page=100001",
        "limit=0", "limit=-1", "limit=51", "limit=no", "limit=1&limit=2"]) {
        const response = await api("get", route + "?" + query, route.includes("/me/") ? "a" : undefined).expect(400);
        assert.equal(response.body.error.code, "VALIDATION_ERROR");
      }
    }
    for (const query of ["minPrice=-1", "minPrice=no", "maxPrice=1.001",
      "minPrice=20&maxPrice=10", "sort=unknown", "category=bad", "q=x&q=y", "q=" + "x".repeat(101)]) {
      await api("get", "/services?" + query).expect(400);
    }
    await api("get", "/providers/me/services?status=deleted", "a").expect(400);
  });

  it("returns complete pagination inside data and in the shared envelope", async () => {
    await create({ title: "Alpha cleaning" });
    await create({ title: "Bravo cleaning" });
    await create({ title: "Charlie cleaning" });
    const response = await api("get", "/services?page=2&limit=2").expect(200);
    assert.deepEqual(response.body.data.meta, { page: 2, limit: 2, totalItems: 3, totalPages: 2 });
    assert.deepEqual(response.body.meta, response.body.data.meta);
    assert.equal(response.body.data.services.length, 1);
    assert.equal(response.body.data.services[0].title, "Charlie cleaning");
    const clamped = await api("get", "/services?page=99&limit=2").expect(200);
    assert.equal(clamped.body.data.meta.page, 2);
    const empty = await api("get", "/services?q=missing").expect(200);
    assert.deepEqual(empty.body.data.meta, { page: 1, limit: 10, totalItems: 0, totalPages: 0 });
  });

  it("keeps inactive services in owner history but out of public results", async () => {
    const active = await create();
    await create({ title: "Draft service" }, "a", false);
    const own = await api("get", "/providers/me/services", "a").expect(200);
    assert.equal(own.body.data.meta.totalItems, 2);
    const drafts = await api("get", "/providers/me/services?status=inactive", "a").expect(200);
    assert.equal(drafts.body.data.meta.totalItems, 1);
    await api("patch", "/services/" + active.id + "/status", "a").send({ status: "inactive" }).expect(200);
    await api("get", "/services/" + active.id).expect(404);
    assert.equal((await api("get", "/services").expect(200)).body.data.meta.totalItems, 0);
  });

  it("hides services belonging to inactive, missing, or no-longer-provider users", async () => {
    const service = await create();
    for (const fields of [{ status: "inactive" }, { status: "active", role: "customer" }]) {
      await User.updateOne({ _id: users.a._id }, { $set: fields });
      await api("get", "/services/" + service.id).expect(404);
      await api("get", "/providers/" + profiles.a._id).expect(404);
      assert.equal((await api("get", "/services").expect(200)).body.data.meta.totalItems, 0);
    }
    await User.deleteOne({ _id: users.a._id });
    await api("get", "/services/" + service.id).expect(404);
    await api("get", "/providers/" + profiles.a._id).expect(404);
  });

  it("handles orphaned provider/category references without crashing", async () => {
    const service = await create();
    await Category.deleteOne({ _id: categories[0]._id });
    await api("get", "/services/" + service.id).expect(404);
    const own = await api("get", "/providers/me/services", "a").expect(200);
    assert.equal(own.body.data.services[0].categoryId, null);
    await Provider.deleteOne({ _id: profiles.a._id });
    await api("get", "/services/" + service.id).expect(404);
    await api("get", "/providers/" + profiles.a._id).expect(404);
    assert.equal((await api("get", "/services").expect(200)).body.data.meta.totalItems, 0);
  });

  it("rejects category changes/activation using an inactive category", async () => {
    const service = await create();
    await api("patch", "/services/" + service.id, "a")
      .send({ categoryId: String(categories[2]._id) }).expect(404);
    await Category.updateOne({ _id: categories[0]._id }, { $set: { status: "inactive" } });
    await api("get", "/services/" + service.id).expect(404);
    await api("patch", "/services/" + service.id + "/status", "a").send({ status: "inactive" }).expect(200);
    await api("patch", "/services/" + service.id + "/status", "a").send({ status: "active" }).expect(404);
  });

  it("returns a safe public provider with a paginated active service summary", async () => {
    await create({ title: "Alpha service" });
    await create({ title: "Bravo service" });
    await create({ title: "Draft service" }, "a", false);
    await create({ title: "Other provider service" }, "b");
    const response = await api("get", "/providers/" + profiles.a._id + "?limit=1").expect(200);
    assert.equal(response.body.data.displayName, profileInput.displayName);
    assert.equal(response.body.data.services.length, 1);
    assert.equal(response.body.data.serviceMeta.totalItems, 2);
    assert.equal(response.body.data.userId, undefined);
    assert.equal(response.body.data.user, undefined);
    assertSafe(response.body);
    await api("get", "/providers/" + new mongoose.Types.ObjectId()).expect(404);
    await api("get", "/services/" + new mongoose.Types.ObjectId()).expect(404);
  });
});
