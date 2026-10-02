const { randomUUID } = require("node:crypto");

const Booking = require("../models/booking");
const Payment = require("../models/payment");
const Service = require("../models/services");
const ServiceProvider = require("../models/serviceProvider");
const AppError = require("../utils/AppError");
const { collectionMeta } = require("../utils/catalogResponse");

const BOOKING_POPULATION = [
  {
    path: "customer",
    select: "fullName role status",
  },
  {
    path: "provider",
    select: "displayName user",
    populate: {
      path: "user",
      select: "fullName role status",
    },
  },
  {
    path: "service",
    select: "title status provider",
  },
  {
    path: "statusHistory.changedBy",
    select: "fullName role",
  },
];

function toId(value) {
  if (!value) return null;
  return String(value._id || value);
}

function toBookingResponse(booking) {
  const customer = booking.customer;
  const provider = booking.provider;

  return {
    id: String(booking._id),

    customer: customer
      ? {
          id: toId(customer),
          fullName: customer.fullName,
        }
      : null,

    provider: provider
      ? {
          id: toId(provider),
          displayName: provider.displayName,
        }
      : null,

    serviceId: toId(booking.service),

    // Snapshots captured at booking creation.
    serviceTitle: booking.serviceTitle,
    providerName: booking.providerDisplayName,
    agreedPrice: booking.agreedPrice,
    currency: booking.currency,
    pricingUnit: booking.pricingUnit,

    scheduledAt: booking.scheduledAt,
    serviceAddress: booking.serviceAddress,
    customerNote: booking.customerNote,

    status: booking.status,
    paymentStatus: booking.paymentStatus,

    statusHistory: booking.statusHistory.map((entry) => ({
      from: entry.from,
      to: entry.to,
      reason: entry.reason,
      changedAt: entry.changedAt,
      changedBy: entry.changedBy
        ? {
            id: toId(entry.changedBy),
            fullName: entry.changedBy.fullName,
            role: entry.changedBy.role,
          }
        : null,
    })),

    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}

async function findProviderProfile(userId) {
  return ServiceProvider.findOne({ user: userId });
}

async function isBookingProvider(booking, userId) {
  const profile = await findProviderProfile(userId);

  return Boolean(
    profile &&
      String(profile._id) === String(booking.provider._id || booking.provider)
  );
}

async function getBookingForParticipant(bookingId, user) {
  const booking = await Booking.findById(bookingId).populate(
    BOOKING_POPULATION
  );

  if (!booking) {
    throw new AppError(
      "Booking not found.",
      404,
      "BOOKING_NOT_FOUND"
    );
  }

  const isCustomer =
    String(booking.customer._id || booking.customer) ===
    String(user._id);

  const provider = await isBookingProvider(booking, user._id);

  if (!isCustomer && !provider && user.role !== "admin") {
    throw new AppError(
      "You do not have permission to view this booking.",
      403,
      "FORBIDDEN"
    );
  }

  return booking;
}

async function createBooking({ customer, ...details }) {
  const scheduledAt = new Date(details.scheduledAt);

  if (scheduledAt.getTime() <= Date.now()) {
    throw new AppError(
      "Choose a future date and time.",
      400,
      "BOOKING_TIME_IN_PAST"
    );
  }

  const service = await Service.findOne({
    _id: details.serviceId,
    status: "active",
  }).populate({
    path: "provider",
    select: "displayName user",
    populate: {
      path: "user",
      select: "role status",
    },
  });

  if (
    !service ||
    !service.provider ||
    !service.provider.user ||
    service.provider.user.role !== "provider" ||
    service.provider.user.status !== "active"
  ) {
    throw new AppError(
      "This service is unavailable for booking.",
      404,
      "SERVICE_UNAVAILABLE"
    );
  }

  if (String(service.provider.user._id) === String(customer._id)) {
    throw new AppError(
      "You cannot book your own service.",
      409,
      "CANNOT_BOOK_OWN_SERVICE"
    );
  }

  const booking = await Booking.create({
    customer: customer._id,
    provider: service.provider._id,
    service: service._id,

    serviceTitle: service.title,
    providerDisplayName: service.provider.displayName,
    agreedPrice: service.price,
    currency: service.currency,
    pricingUnit: service.pricingUnit,

    scheduledAt,
    serviceAddress: details.serviceAddress,
    customerNote: details.customerNote,

    status: "pending",
    paymentStatus: "unpaid",

    statusHistory: [
      {
        to: "pending",
        reason: "",
        changedBy: customer._id,
        changedAt: new Date(),
      },
    ],
  });

  await booking.populate(BOOKING_POPULATION);

  return toBookingResponse(booking);
}

async function listMyBookings({ user, status, from, to, page, limit }) {
  let filter;

  if (user.role === "customer") {
    filter = { customer: user._id };
  } else if (user.role === "provider") {
    const profile = await findProviderProfile(user._id);

    if (!profile) {
      return {
        bookings: [],
        meta: collectionMeta(0, page, limit),
      };
    }

    filter = { provider: profile._id };
  } else {
    throw new AppError(
      "Administrators must use the administration booking endpoint.",
      403,
      "FORBIDDEN"
    );
  }

  if (status) {
    filter.status = status;
  }

  if (from || to) {
    filter.scheduledAt = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {}),
    };
  }

  const totalItems = await Booking.countDocuments(filter);
  const meta = collectionMeta(totalItems, page, limit);

  const bookings = await Booking.find(filter)
    .sort({
      scheduledAt: 1,
      _id: 1,
    })
    .skip((meta.page - 1) * meta.limit)
    .limit(meta.limit)
    .populate(BOOKING_POPULATION);

  return {
    bookings: bookings.map(toBookingResponse),
    meta,
  };
}

async function getBooking({ bookingId, user }) {
  const booking = await getBookingForParticipant(bookingId, user);

  return toBookingResponse(booking);
}

function canTransition({ booking, user, nextStatus, isProvider }) {
  const currentStatus = booking.status;
  const isCustomer =
    String(booking.customer._id || booking.customer) ===
    String(user._id);

  if (
    isProvider &&
    currentStatus === "pending" &&
    ["accepted", "rejected"].includes(nextStatus)
  ) {
    return true;
  }

  if (
    isProvider &&
    currentStatus === "accepted" &&
    nextStatus === "in_progress"
  ) {
    return true;
  }

  if (
    isProvider &&
    currentStatus === "in_progress" &&
    nextStatus === "completed"
  ) {
    return true;
  }

  if (
    isCustomer &&
    ["pending", "accepted"].includes(currentStatus) &&
    nextStatus === "cancelled"
  ) {
    return true;
  }

  return false;
}

async function updateBookingStatus({
  bookingId,
  user,
  status,
  reason,
}) {
  const booking = await Booking.findById(bookingId).populate(
    BOOKING_POPULATION
  );

  if (!booking) {
    throw new AppError(
      "Booking not found.",
      404,
      "BOOKING_NOT_FOUND"
    );
  }

  const provider = await isBookingProvider(booking, user._id);

  if (!canTransition({
    booking,
    user,
    nextStatus: status,
    isProvider: provider,
  })) {
    throw new AppError(
      "This status change is not allowed.",
      409,
      "INVALID_BOOKING_TRANSITION"
    );
  }

  // The old status in this filter prevents two competing requests
  // from both changing the booking based on stale information.
  const updated = await Booking.findOneAndUpdate(
    {
      _id: booking._id,
      status: booking.status,
    },
    {
      $set: {
        status,
      },
      $push: {
        statusHistory: {
          from: booking.status,
          to: status,
          reason,
          changedBy: user._id,
          changedAt: new Date(),
        },
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    }
  ).populate(BOOKING_POPULATION);

  if (!updated) {
    throw new AppError(
      "This booking changed before your request completed. Reload and try again.",
      409,
      "BOOKING_CHANGED"
    );
  }

  return toBookingResponse(updated);
}

function toPaymentResponse(payment) {
  if (!payment) {
    return {
      paymentStatus: "unpaid",
      payment: null,
    };
  }

  return {
    paymentStatus: payment.status,
    payment: {
      id: String(payment._id),
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      reference: payment.reference,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    },
  };
}

async function createTestPayment({ bookingId, customer }) {
  const booking = await Booking.findOne({
    _id: bookingId,
    customer: customer._id,
  });

  if (!booking) {
    throw new AppError(
      "Booking not found.",
      404,
      "BOOKING_NOT_FOUND"
    );
  }

  if (booking.paymentStatus !== "unpaid") {
    throw new AppError(
      "This booking already has a payment record.",
      409,
      "PAYMENT_ALREADY_EXISTS"
    );
  }

  if (["cancelled", "rejected"].includes(booking.status)) {
    throw new AppError(
      "Cancelled or rejected bookings cannot be paid.",
      409,
      "BOOKING_NOT_PAYABLE"
    );
  }

  let payment;

  try {
    payment = await Payment.create({
      booking: booking._id,
      customer: customer._id,
      amount: booking.agreedPrice,
      currency: booking.currency,
      status: "paid",
      method: "test",
      reference: `test_${randomUUID()}`,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(
        "This booking already has a payment record.",
        409,
        "PAYMENT_ALREADY_EXISTS"
      );
    }

    throw error;
  }

  await Booking.updateOne(
    {
      _id: booking._id,
      paymentStatus: "unpaid",
    },
    {
      $set: {
        paymentStatus: "paid",
      },
    }
  );

  return toPaymentResponse(payment);
}

async function getPayment({ bookingId, user }) {
  const booking = await getBookingForParticipant(bookingId, user);

  const payment = await Payment.findOne({
    booking: booking._id,
  });

  return toPaymentResponse(payment);
}

module.exports = {
  createBooking,
  listMyBookings,
  getBooking,
  updateBookingStatus,
  createTestPayment,
  getPayment,
};