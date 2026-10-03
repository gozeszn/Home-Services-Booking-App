const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

describe("Member Three booking and payment API", { concurrency: false }, () => {
  let mongo;
  let app;
  let User;
  let Provider;
  let Service;
  let Category;
  let Booking;
  let Payment;
  let users;
  let tokens;
  let profiles;
  let activeService;

  function api(method, route, who) {
    const call = request(app)[method](`/api/v1${route}`);
    return who ? call.auth(tokens[who], { type: "bearer" }) : call;
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

  function futureDate(days = 2) {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  function createBooking(who = "customer", overrides = {}) {
    return api("post", "/bookings", who)
      .send({
        serviceId: String(activeService._id),
        scheduledAt: futureDate(),
        serviceAddress: "15 Admiralty Way, Lekki, Lagos",
        customerNote: "Please call before arriving.",
        ...overrides,
      });
  }

  before(async () => {
    mongo = await MongoMemoryServer.create();

    Object.assign(process.env, {
      NODE_ENV: "test",
      PORT: "5000",
      MONGODB_URI: mongo.getUri("booking_test"),
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
    Payment = require("../src/models/payment");

    await mongoose.connect(process.env.MONGODB_URI);

    await Promise.all([
      User.init(),
      Provider.init(),
      Service.init(),
      Category.init(),
      Booking.init(),
      Payment.init(),
    ]);
  });

  beforeEach(async () => {
    await Promise.all([
      Payment.deleteMany({}),
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
      ["otherProvider", "provider"],
      ["admin", "admin"],
    ]) {
      users[key] = await User.create({
        fullName: `Test ${key}`,
        email: `${key}@booking.test`,
        passwordHash: "unused-test-password-hash",
        role,
        status: "active",
      });

      tokens[key] = tokenFor(users[key]);
    }

    profiles = {
      provider: await Provider.create({
        user: users.provider._id,
        displayName: "Bright Fix Services",
        description: "Reliable home repair and maintenance services.",
        phone: "08012345678",
        serviceArea: "Lagos",
        availabilitySummary: "Monday to Saturday, 8am to 6pm",
      }),
      otherProvider: await Provider.create({
        user: users.otherProvider._id,
        displayName: "Quick Home Care",
        description: "Professional cleaning and household maintenance.",
        phone: "08087654321",
        serviceArea: "Abuja",
        availabilitySummary: "Weekdays, 9am to 5pm",
      }),
    };

    const category = await Category.create({
      name: "Home Cleaning",
      status: "active",
    });

    activeService = await Service.create({
      provider: profiles.provider._id,
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

  it("requires a logged-in customer to create a booking", async () => {
    await api("post", "/bookings")
      .send({
        serviceId: String(activeService._id),
        scheduledAt: futureDate(),
        serviceAddress: "15 Admiralty Way, Lekki, Lagos",
      })
      .expect(401);

    await createBooking("provider").expect(403);
    await createBooking("admin").expect(403);
  });

  it("creates a pending booking using protected service snapshots", async () => {
    const response = await createBooking().expect(201);
    const booking = response.body.data;

    assert.equal(booking.status, "pending");
    assert.equal(booking.paymentStatus, "unpaid");
    assert.equal(booking.serviceTitle, "Deep Home Cleaning");
    assert.equal(booking.providerName, "Bright Fix Services");
    assert.equal(booking.agreedPrice, 15000);
    assert.equal(booking.currency, "NGN");
    assert.equal(booking.pricingUnit, "visit");
    assert.equal(booking.statusHistory.length, 1);
    assert.equal(booking.statusHistory[0].to, "pending");

    await Service.updateOne(
      { _id: activeService._id },
      { $set: { price: 99999, title: "Changed title" } }
    );

    const savedBooking = await Booking.findById(booking.id);
    assert.equal(savedBooking.agreedPrice, 15000);
    assert.equal(savedBooking.serviceTitle, "Deep Home Cleaning");
  });

  it("rejects unavailable services and invalid booking input", async () => {
    await createBooking("customer", {
      scheduledAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    }).expect(400);

    await createBooking("customer", {
      serviceAddress: "Too short",
    }).expect(400);

    await createBooking("customer", {
      serviceId: "not-an-object-id",
    }).expect(400);

    await Service.updateOne(
      { _id: activeService._id },
      { $set: { status: "inactive" } }
    );

    await createBooking().expect(404);
  });

  it("lists bookings only for the authenticated customer or provider", async () => {
    await createBooking().expect(201);

    const otherBooking = await Booking.create({
      customer: users.otherCustomer._id,
      provider: profiles.provider._id,
      service: activeService._id,
      serviceTitle: activeService.title,
      providerDisplayName: profiles.provider.displayName,
      agreedPrice: activeService.price,
      currency: "NGN",
      pricingUnit: "visit",
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      serviceAddress: "20 Airport Road, Ikeja, Lagos",
      status: "pending",
      paymentStatus: "unpaid",
      statusHistory: [
        {
          to: "pending",
          changedBy: users.otherCustomer._id,
        },
      ],
    });

    const customerList = await api("get", "/bookings", "customer").expect(200);
    assert.equal(customerList.body.data.bookings.length, 1);
    assert.equal(
      customerList.body.data.bookings[0].customer.id,
      String(users.customer._id)
    );

    const providerList = await api("get", "/bookings", "provider").expect(200);
    assert.equal(providerList.body.data.bookings.length, 2);

    const otherCustomerList = await api(
      "get",
      "/bookings",
      "otherCustomer"
    ).expect(200);

    assert.equal(otherCustomerList.body.data.bookings.length, 1);
    assert.equal(
      otherCustomerList.body.data.bookings[0].id,
      String(otherBooking._id)
    );

    await api("get", "/bookings", "admin").expect(403);
  });

  it("allows only participants and admins to view a booking", async () => {
    const created = await createBooking().expect(201);
    const bookingId = created.body.data.id;

    await api("get", `/bookings/${bookingId}`, "customer").expect(200);
    await api("get", `/bookings/${bookingId}`, "provider").expect(200);
    await api("get", `/bookings/${bookingId}`, "admin").expect(200);

    await api("get", `/bookings/${bookingId}`, "otherCustomer").expect(403);
    await api("get", "/bookings/not-an-object-id", "customer").expect(400);
  });

  it("enforces the provider booking lifecycle", async () => {
    const created = await createBooking().expect(201);
    const bookingId = created.body.data.id;

    await api("patch", `/bookings/${bookingId}/status`, "customer")
      .send({ status: "accepted" })
      .expect(409);

    const accepted = await api(
      "patch",
      `/bookings/${bookingId}/status`,
      "provider"
    )
      .send({ status: "accepted", reason: "Booking confirmed." })
      .expect(200);

    assert.equal(accepted.body.data.status, "accepted");

    const inProgress = await api(
      "patch",
      `/bookings/${bookingId}/status`,
      "provider"
    )
      .send({ status: "in_progress" })
      .expect(200);

    assert.equal(inProgress.body.data.status, "in_progress");

    const completed = await api(
      "patch",
      `/bookings/${bookingId}/status`,
      "provider"
    )
      .send({ status: "completed" })
      .expect(200);

    assert.equal(completed.body.data.status, "completed");
    assert.equal(completed.body.data.statusHistory.length, 4);
  });

  it("allows customers to cancel only pending or accepted bookings", async () => {
    const created = await createBooking().expect(201);
    const bookingId = created.body.data.id;

    const cancelled = await api(
      "patch",
      `/bookings/${bookingId}/status`,
      "customer"
    )
      .send({ status: "cancelled", reason: "My plans changed." })
      .expect(200);

    assert.equal(cancelled.body.data.status, "cancelled");

    await api(
      "patch",
      `/bookings/${bookingId}/status`,
      "provider"
    )
      .send({ status: "accepted" })
      .expect(409);
  });

  it("allows a customer to make one simulated test payment", async () => {
    const created = await createBooking().expect(201);
    const bookingId = created.body.data.id;

    const payment = await api(
      "post",
      `/bookings/${bookingId}/payments`,
      "customer"
    )
      .send({ method: "test", confirm: true })
      .expect(201);

    assert.equal(payment.body.data.paymentStatus, "paid");
    assert.equal(payment.body.data.payment.amount, 15000);
    assert.equal(payment.body.data.payment.currency, "NGN");
    assert.equal(payment.body.data.payment.method, "test");
    assert.match(payment.body.data.payment.reference, /^test_/);

    await api("post", `/bookings/${bookingId}/payments`, "customer")
      .send({ method: "test", confirm: true })
      .expect(409);

    const booking = await Booking.findById(bookingId);
    assert.equal(booking.paymentStatus, "paid");

    assert.equal(await Payment.countDocuments({ booking: bookingId }), 1);
  });

  it("does not accept payment data from the browser", async () => {
    const created = await createBooking().expect(201);
    const bookingId = created.body.data.id;

    await api("post", `/bookings/${bookingId}/payments`, "customer")
      .send({
        method: "test",
        confirm: true,
        amount: 1,
      })
      .expect(400);

    await api("post", `/bookings/${bookingId}/payments`, "customer")
      .send({ method: "test" })
      .expect(400);

    await api("post", `/bookings/${bookingId}/payments`, "provider")
      .send({ method: "test", confirm: true })
      .expect(403);
  });

  it("prevents payments for cancelled or rejected bookings", async () => {
    const created = await createBooking().expect(201);
    const bookingId = created.body.data.id;

    await api("patch", `/bookings/${bookingId}/status`, "customer")
      .send({ status: "cancelled" })
      .expect(200);

    await api("post", `/bookings/${bookingId}/payments`, "customer")
      .send({ method: "test", confirm: true })
      .expect(409);
  });

  it("lets booking participants and admins view payment details", async () => {
    const created = await createBooking().expect(201);
    const bookingId = created.body.data.id;

    await api("post", `/bookings/${bookingId}/payments`, "customer")
      .send({ method: "test", confirm: true })
      .expect(201);

    await api("get", `/bookings/${bookingId}/payment`, "customer").expect(200);
    await api("get", `/bookings/${bookingId}/payment`, "provider").expect(200);
    await api("get", `/bookings/${bookingId}/payment`, "admin").expect(200);

    await api(
      "get",
      `/bookings/${bookingId}/payment`,
      "otherCustomer"
    ).expect(403);
  });
});