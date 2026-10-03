const Booking = require("../models/booking");
const Review = require("../models/review");
const Service = require("../models/services");
const AppError = require("../utils/AppError");
const { collectionMeta } = require("../utils/catalogResponse");

const REVIEW_POPULATION = [
  { path: "customer", select: "fullName" },
  { path: "provider", select: "displayName" },
  { path: "service", select: "title" },
  { path: "moderation.moderatedBy", select: "fullName" },
];

function toId(value) {
  if (!value) return null;

  return String(value._id || value);
}

function toReviewResponse(review, { includeModeration = false } = {}) {
  const response = {
    id: String(review._id),
    bookingId: toId(review.booking),
    service: review.service
      ? {
          id: toId(review.service),
          title: review.service.title,
        }
      : null,
    provider: review.provider
      ? {
          id: toId(review.provider),
          displayName: review.provider.displayName,
        }
      : null,
    customer: review.customer
      ? {
          id: toId(review.customer),
          fullName: review.customer.fullName,
        }
      : null,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };

  if (includeModeration) {
    response.moderation = {
      status: review.moderation.status,
      reason: review.moderation.reason,
      moderatedAt: review.moderation.moderatedAt,
      moderatedBy: review.moderation.moderatedBy
        ? {
            id: toId(review.moderation.moderatedBy),
            fullName: review.moderation.moderatedBy.fullName,
          }
        : null,
    };
  }

  return response;
}

async function populateReview(review) {
  return review.populate(REVIEW_POPULATION);
}

async function createReview({ customer, bookingId, rating, comment }) {
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

  if (booking.status !== "completed") {
    throw new AppError(
      "Only completed bookings can be reviewed.",
      409,
      "BOOKING_NOT_COMPLETED"
    );
  }

  try {
    const review = await Review.create({
      booking: booking._id,
      customer: customer._id,
      provider: booking.provider,
      service: booking.service,
      rating,
      comment,
    });

    await populateReview(review);

    return toReviewResponse(review, { includeModeration: true });
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError(
        "You have already reviewed this booking.",
        409,
        "REVIEW_ALREADY_EXISTS"
      );
    }

    throw error;
  }
}

async function getMyBookingReview({ customer, bookingId }) {
  const review = await Review.findOne({
    booking: bookingId,
    customer: customer._id,
  }).populate(REVIEW_POPULATION);

  return review
    ? toReviewResponse(review, { includeModeration: true })
    : null;
}

async function listServiceReviews({ serviceId, page, limit }) {
  const service = await Service.findOne({
    _id: serviceId,
    status: "active",
  });

  if (!service) {
    throw new AppError(
      "Service not found.",
      404,
      "SERVICE_NOT_FOUND"
    );
  }

  const filter = {
    service: service._id,
    "moderation.status": "published",
  };

  const totalItems = await Review.countDocuments(filter);
  const meta = collectionMeta(totalItems, page, limit);

  const reviews = await Review.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .skip((meta.page - 1) * meta.limit)
    .limit(meta.limit)
    .populate(REVIEW_POPULATION);

  return {
    reviews: reviews.map((review) => toReviewResponse(review)),
    meta,
  };
}

function emptyRatingSummary() {
  return {
    available: true,
    averageRating: null,
    ratingCount: 0,
  };
}

async function getRatingSummaryMap(field, ids) {
  const uniqueIds = [
    ...new Map(
      ids
        .filter(Boolean)
        .map((id) => [String(id), id])
    ).values(),
  ];

  const summaries = new Map(
    uniqueIds.map((id) => [String(id), emptyRatingSummary()])
  );

  if (uniqueIds.length === 0) {
    return summaries;
  }

  const grouped = await Review.aggregate([
    {
      $match: {
        [field]: { $in: uniqueIds },
        "moderation.status": "published",
      },
    },
    {
      $group: {
        _id: `$${field}`,
        averageRating: { $avg: "$rating" },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  for (const item of grouped) {
    summaries.set(String(item._id), {
      available: true,
      averageRating: Number(item.averageRating.toFixed(1)),
      ratingCount: item.ratingCount,
    });
  }

  return summaries;
}

async function getServiceRatingSummary(serviceId) {
  const summaries = await getRatingSummaryMap("service", [serviceId]);

  return summaries.get(String(serviceId)) || emptyRatingSummary();
}

async function getServiceRatingSummaries(serviceIds) {
  return getRatingSummaryMap("service", serviceIds);
}

async function getProviderRatingSummaries(providerIds) {
  return getRatingSummaryMap("provider", providerIds);
}

async function listAdminReviews({ status, page, limit }) {
  const filter = status
    ? { "moderation.status": status }
    : {};

  const totalItems = await Review.countDocuments(filter);
  const meta = collectionMeta(totalItems, page, limit);

  const reviews = await Review.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .skip((meta.page - 1) * meta.limit)
    .limit(meta.limit)
    .populate(REVIEW_POPULATION);

  return {
    reviews: reviews.map((review) =>
      toReviewResponse(review, { includeModeration: true })
    ),
    meta,
  };
}

async function updateReviewModeration({
  reviewId,
  admin,
  status,
  reason,
}) {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError(
      "Review not found.",
      404,
      "REVIEW_NOT_FOUND"
    );
  }

  review.moderation.status = status;
  review.moderation.reason = reason;
  review.moderation.moderatedBy = admin._id;
  review.moderation.moderatedAt = new Date();

  await review.save();
  await populateReview(review);

  return toReviewResponse(review, { includeModeration: true });
}

module.exports = {
  createReview,
  getMyBookingReview,
  listServiceReviews,
  getServiceRatingSummary,
  listAdminReviews,
  updateReviewModeration,
  getServiceRatingSummaries,
  getProviderRatingSummaries,
};