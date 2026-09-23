const {
  describe,
  it,
  before,
  after,
  beforeEach,
} = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

describe("Member One API", { concurrency: false }, () => {
  let mongo;
  let app;
  let User;

  const customer = {
    fullName: "Test Customer",
    email: "customer@example.com",
    password: "TestPassword123!",
    role: "customer",
  };

  async function registerCustomer() {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(customer)
      .expect(201);

    return response.body.data;
  }

  before(async () => {
    mongo = await MongoMemoryServer.create();

    // Set these before importing application modules.
    // dotenv will preserve these existing environment values.
    process.env.NODE_ENV = "test";
    process.env.PORT = "5000";
    process.env.MONGODB_URI = mongo.getUri("home_services_test");
    process.env.JWT_SECRET = randomBytes(48).toString("hex");
    process.env.JWT_EXPIRES_IN = "1h";
    process.env.CLIENT_ORIGIN = "http://localhost:5173";

    app = require("./src/app");
    User = require("./src/models/User");

    const connectDatabase = require("./src/config/database");
    await connectDatabase();
  });

  beforeEach(async () => {
    // Clear records while preserving the unique email index.
    await User.deleteMany({});
  });

  after(async () => {
    try {
      await mongoose.disconnect();
    } finally {
      if (mongo) {
        await mongo.stop();
      }
    }
  });

  it("returns the health response", async () => {
    const response = await request(app)
      .get("/api/v1/health")
      .expect(200);

    assert.equal(response.body.success, true);
    assert.equal(response.body.data.status, "ok");
  });

  it("registers a customer and stores a password hash", async () => {
    const data = await registerCustomer();

    assert.equal(data.user.email, customer.email);
    assert.equal(data.user.role, "customer");
    assert.equal(typeof data.accessToken, "string");
    assert.ok(data.accessToken.length > 0);

    assert.equal("password" in data.user, false);
    assert.equal("passwordHash" in data.user, false);

    const storedUser = await User.findOne({
      email: customer.email,
    }).select("+passwordHash");

    assert.ok(storedUser);
    assert.ok(storedUser.passwordHash);
    assert.notEqual(storedUser.passwordHash, customer.password);
  });

  it("registers a provider", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        ...customer,
        email: "provider@example.com",
        role: "provider",
      })
      .expect(201);

    assert.equal(response.body.data.user.role, "provider");
  });

  it("rejects a duplicate email regardless of letter case", async () => {
    await registerCustomer();

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        ...customer,
        email: "CUSTOMER@EXAMPLE.COM",
      })
      .expect(409);

    assert.equal(
      response.body.error.code,
      "EMAIL_ALREADY_EXISTS"
    );
    assert.equal(await User.countDocuments({}), 1);
  });

  it("rejects public admin registration", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        ...customer,
        role: "admin",
      })
      .expect(400);

    assert.equal(response.body.error.code, "VALIDATION_ERROR");
    assert.equal(await User.countDocuments({}), 0);
  });

  it("logs in and accesses the protected profile", async () => {
    await registerCustomer();

    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: customer.email,
        password: customer.password,
      })
      .expect(200);

    const profile = await request(app)
      .get("/api/v1/users/me")
      .set(
        "Authorization",
        `Bearer ${login.body.data.accessToken}`
      )
      .expect(200);

    assert.equal(profile.body.data.user.email, customer.email);
    assert.equal("passwordHash" in profile.body.data.user, false);
  });

  it("returns the same error for wrong passwords and unknown emails", async () => {
    await registerCustomer();

    const wrongPassword = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: customer.email,
        password: "WrongPassword123!",
      })
      .expect(401);

    const unknownEmail = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "unknown@example.com",
        password: customer.password,
      })
      .expect(401);

    assert.equal(
      wrongPassword.body.error.code,
      "INVALID_CREDENTIALS"
    );

    assert.deepEqual(
      wrongPassword.body.error,
      unknownEmail.body.error
    );
  });

  it("rejects missing and invalid tokens", async () => {
    const missing = await request(app)
      .get("/api/v1/users/me")
      .expect(401);

    assert.equal(
      missing.body.error.code,
      "AUTHENTICATION_REQUIRED"
    );

    const invalid = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);

    assert.equal(invalid.body.error.code, "INVALID_TOKEN");
  });

  it("updates the profile and preserves omitted fields", async () => {
    const { user, accessToken } = await registerCustomer();

    await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        phone: "+2348012345678",
        location: "Lagos",
      })
      .expect(200);

    const updated = await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        location: "Abuja",
      })
      .expect(200);

    assert.equal(updated.body.data.user.fullName, customer.fullName);
    assert.equal(updated.body.data.user.phone, "+2348012345678");
    assert.equal(updated.body.data.user.location, "Abuja");

    const storedUser = await User.findById(user.id);
    assert.equal(storedUser.location, "Abuja");
    assert.equal(storedUser.phone, "+2348012345678");
  });

  it("rejects empty updates and attempts to change role", async () => {
    const { user, accessToken } = await registerCustomer();

    for (const body of [{}, { role: "admin" }]) {
      const response = await request(app)
        .patch("/api/v1/users/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(body)
        .expect(400);

      assert.equal(response.body.error.code, "VALIDATION_ERROR");
    }

    const storedUser = await User.findById(user.id);
    assert.equal(storedUser.role, "customer");
  });

  it("blocks an inactive account from login and existing-token access", async () => {
    const { user, accessToken } = await registerCustomer();

    await User.updateOne(
      { _id: user.id },
      { $set: { status: "inactive" } }
    );

    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: customer.email,
        password: customer.password,
      })
      .expect(403);

    assert.equal(login.body.error.code, "ACCOUNT_INACTIVE");

    const profile = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(403);

    assert.equal(profile.body.error.code, "ACCOUNT_INACTIVE");
  });

  it("handles malformed JSON with the shared error format", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .set("Content-Type", "application/json")
      .send("{")
      .expect(400);

    assert.equal(response.body.success, false);
    assert.equal(response.body.error.code, "INVALID_JSON");
  });

  it("allows frontend preflight requests without authentication", async () => {
    const response = await request(app)
      .options("/api/v1/users/me")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "PATCH")
      .set(
        "Access-Control-Request-Headers",
        "authorization,content-type"
      )
      .expect(204);

    assert.equal(
      response.headers["access-control-allow-origin"],
      "http://localhost:5173"
    );
  });
});