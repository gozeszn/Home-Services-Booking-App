const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

describe("Member Four review API", { concurrency: false }, () => {
  let mongo;
  let app;
  let User;
  let Provider;
  let Service;
  let Category;
  let Booking;
  let Review;
  let users;
  let tokens;
  let providerProfile;
  let service;

  function api(method, route, who) {
    const call = request(app)[method](`/api/v1${route}`);

    return who
      ? call.auth(tokens[who], { type: "bearer" })
      : call;
  }

  function tokenFor(user) {
    return jwt.sign(
      { role: user.role },
      process.env.JWT_SECRET,
      {
        subject: String(user._id),
        algorithm: "HS256",
        expiresIn: "1h",
      }
    );
  }

  async function createBooking(customer, status = "completed") {
    return Booking.create({
      customer: customer._id,
      provider: providerProfile._id,
      service: service._id,
      serviceTitle: service.title,
      providerDisplayName: providerProfile.displayName,
      agreedPrice: service.price,
      currency: "NGN",
      pricingUnit: "visit",
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      serviceAddress: "15 Admiralty Way, Lekki, Lagos",
      customerNote: "",
      status,
      paymentStatus: "unpaid",
      statusHistory: [
        {
          to: status,
          changedBy: customer._id,
        },
      ],
    });
  }

  function createReview(bookingId, who = "customer", body = {}) {
    return api("post", `/bookings/${bookingId}/review`, who).send({
      rating: 5,
      comment: "The provider arrived on time and did an excellent job.",
      ...body,
    });
  }

  before(async () => {
    mongo = await MongoMemoryServer.create();

    Object.assign(process.env, {
      NODE_ENV: "test",
      PORT: "5000",
      MONGODB_URI: mongo.getUri("review_test"),
      JWT_SECRET: randomBytes(48).toString("hex"),
      JWT_EXPIRES_IN: "1h",
      CLIENT_ORIGIN: "http://localhost:5173",
    });

    app = require("../src/app");
    User = require("../src/models/User");
    Provider = require("../src/models/serviceProvider");
    Service = require("../src/models/services");
    Category = require("../src/models/category");
    Booking = require("../src/models/booking");
    Review = require("../src/models/review");

    await mongoose.connect(process.env.MONGODB_URI);

    await Promise.all([
      User.init(),
      Provider.init(),
      Service.init(),
      Category.init(),
      Booking.init(),
      Review.init(),
    ]);
  });

  beforeEach(async () => {
    await Promise.all([
      Review.deleteMany({}),
      Booking.deleteMany({}),
      Service.deleteMany({}),
      Provider.deleteMany({}),
      Category.deleteMany({}),
      User.deleteMany({}),
    ]);

    users = {};
    tokens = {};

    for (const [key, role] of [
      ["customer", "customer"],
      ["otherCustomer", "customer"],
      ["provider", "provider"],
      ["admin", "admin"],
    ]) {
      users[key] = await User.create({
        fullName: `Test ${key}`,
        email: `${key}@review.test`,
        passwordHash: "unused-test-password-hash",
        role,
        status: "active",
      });

      tokens[key] = tokenFor(users[key]);
    }

    providerProfile = await Provider.create({
      user: users.provider._id,
      displayName: "Bright Fix Services",
      description: "Reliable home repair and maintenance services.",
      phone: "08012345678",
      serviceArea: "Lagos",
      availabilitySummary: "Monday to Saturday, 8am to 6pm",
    });

    const category = await Category.create({
      name: "Home Cleaning",
      status: "active",
    });

    service = await Service.create({
      provider: providerProfile._id,
      title: "Deep Home Cleaning",
      description: "Complete residential cleaning for homes and apartments.",
      categoryId: category._id,
      price: 15000,
      currency: "NGN",
      pricingUnit: "visit",
      serviceArea: "Lagos",
      availabilitySummary: "Available on weekdays",
      status: "active",
    });
  });

  after(async () => {
    try {
      await mongoose.disconnect();
    } finally {
      if (mongo) await mongo.stop();
    }
  });

  it("allows a customer to review their completed booking", async () => {
    const booking = await createBooking(users.customer);

    const response = await createReview(booking._id).expect(201);

    assert.equal(response.body.data.rating, 5);
    assert.equal(
      response.body.data.comment,
      "The provider arrived on time and did an excellent job."
    );
    assert.equal(response.body.data.bookingId, String(booking._id));
    assert.equal(
      response.body.data.service.id,
      String(service._id)
    );
    assert.equal(
      response.body.data.provider.id,
      String(providerProfile._id)
    );
    assert.equal(
      response.body.data.moderation.status,
      "published"
    );

    assert.equal(await Review.countDocuments(), 1);
  });

  it("rejects reviews for pending bookings, another customer's booking, and duplicate reviews", async () => {
    const pending = await createBooking(users.customer, "pending");

    await createReview(pending._id).expect(409);

    const otherBooking = await createBooking(users.otherCustomer);

    await createReview(otherBooking._id).expect(404);

    const completed = await createBooking(users.customer);

    await createReview(completed._id).expect(201);
    await createReview(completed._id).expect(409);
  });

  it("requires authentication and a customer role to submit reviews", async () => {
    const booking = await createBooking(users.customer);

    await api("post", `/bookings/${booking._id}/review`)
      .send({ rating: 5, comment: "" })
      .expect(401);

    await createReview(booking._id, "provider").expect(403);
    await createReview(booking._id, "admin").expect(403);
  });

  it("validates review bodies and booking identifiers", async () => {
    const booking = await createBooking(users.customer);

    for (const body of [
      {},
      { rating: 0 },
      { rating: 6 },
      { rating: 4.5 },
      { rating: "5" },
      { rating: 5, comment: "x".repeat(1001) },
      { rating: 5, unknown: "field" },
    ]) {
      await api(
        "post",
        `/bookings/${booking._id}/review`,
        "customer"
      )
  .send(body)
  .expect(400);
    }

    await api("post", "/bookings/not-an-object-id/review", "customer")
      .send({ rating: 5, comment: "" })
      .expect(400);
  });

  it("returns only the signed-in customer's review for a booking", async () => {
    const booking = await createBooking(users.customer);

    await createReview(booking._id).expect(201);

    const own = await api(
      "get",
      `/bookings/${booking._id}/review`,
      "customer"
    ).expect(200);

    assert.equal(own.body.data.rating, 5);

    const other = await api(
      "get",
      `/bookings/${booking._id}/review`,
      "otherCustomer"
    ).expect(200);

    assert.equal(other.body.data, null);
  });

  it("returns published service reviews publicly with pagination", async () => {
    const first = await createBooking(users.customer);
    const second = await createBooking(users.otherCustomer);

    await createReview(first._id, "customer", {
      rating: 4,
      comment: "Very good service.",
    }).expect(201);

    await createReview(second._id, "otherCustomer", {
      rating: 5,
      comment: "Excellent service.",
    }).expect(201);

    const response = await api(
      "get",
      `/services/${service._id}/reviews?page=1&limit=1`
    ).expect(200);

    assert.equal(response.body.data.reviews.length, 1);
    assert.equal(response.body.data.meta.totalItems, 2);
    assert.equal(response.body.data.meta.totalPages, 2);
    assert.equal(response.body.meta.totalItems, 2);

    const review = response.body.data.reviews[0];
    assert.equal(review.moderation, undefined);
    assert.equal(typeof review.customer.fullName, "string");
  });

  it("does not expose hidden reviews publicly", async () => {
    const booking = await createBooking(users.customer);
    const created = await createReview(booking._id).expect(201);

    await api(
      "patch",
      `/admin/reviews/${created.body.data.id}/moderation`,
      "admin"
    )
      .send({
        status: "hidden",
        reason: "Contains inappropriate language.",
      })
      .expect(200);

    const publicList = await api(
      "get",
      `/services/${service._id}/reviews`
    ).expect(200);

    assert.equal(publicList.body.data.reviews.length, 0);

    const adminList = await api("get", "/admin/reviews?status=hidden", "admin")
      .expect(200);

    assert.equal(adminList.body.data.reviews.length, 1);
    assert.equal(
      adminList.body.data.reviews[0].moderation.status,
      "hidden"
    );
  });

  it("allows only admins to list and moderate reviews", async () => {
    const booking = await createBooking(users.customer);
    const created = await createReview(booking._id).expect(201);
    const reviewId = created.body.data.id;

    await api("get", "/admin/reviews").expect(401);
    await api("get", "/admin/reviews", "customer").expect(403);

    await api(
      "patch",
      `/admin/reviews/${reviewId}/moderation`,
      "customer"
    )
      .send({ status: "hidden" })
      .expect(403);

    const moderated = await api(
      "patch",
      `/admin/reviews/${reviewId}/moderation`,
      "admin"
    )
      .send({
        status: "hidden",
        reason: "Reviewed by an administrator.",
      })
      .expect(200);

    assert.equal(moderated.body.data.moderation.status, "hidden");
    assert.equal(
      moderated.body.data.moderation.moderatedBy.id,
      String(users.admin._id)
    );

    const restored = await api(
      "patch",
      `/admin/reviews/${reviewId}/moderation`,
      "admin"
    )
      .send({ status: "published" })
      .expect(200);

    assert.equal(restored.body.data.moderation.status, "published");
  });

  it("validates public and admin collection queries", async () => {
    for (const query of [
      "page=0",
      "page=no",
      "limit=0",
      "limit=51",
      "page=1&page=2",
    ]) {
      await api(
        "get",
        `/services/${service._id}/reviews?${query}`
      ).expect(400);
    }

    await api("get", "/admin/reviews?status=deleted", "admin").expect(400);

    await api(
      "patch",
      "/admin/reviews/not-an-object-id/moderation",
      "admin"
    )
      .send({ status: "hidden" })
      .expect(400);
  });
});