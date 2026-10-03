const reviewService = require("../services/reviewService");

async function createReview(req, res) {
  const data = await reviewService.createReview({
    customer: req.user,
    bookingId: req.validated.params.bookingId,
    ...req.validated.body,
  });

  return res.status(201).json({
    success: true,
    data,
  });
}

async function getMyBookingReview(req, res) {
  const data = await reviewService.getMyBookingReview({
    customer: req.user,
    bookingId: req.validated.params.bookingId,
  });

  return res.status(200).json({
    success: true,
    data,
  });
}

async function listServiceReviews(req, res) {
  const data = await reviewService.listServiceReviews({
    serviceId: req.validated.params.serviceId,
    ...req.validated.query,
  });

  return res.status(200).json({
    success: true,
    data,
    meta: data.meta,
  });
}

async function listAdminReviews(req, res) {
  const data = await reviewService.listAdminReviews(
    req.validated.query
  );

  return res.status(200).json({
    success: true,
    data,
    meta: data.meta,
  });
}

async function updateReviewModeration(req, res) {
  const data = await reviewService.updateReviewModeration({
    reviewId: req.validated.params.reviewId,
    admin: req.user,
    ...req.validated.body,
  });

  return res.status(200).json({
    success: true,
    data,
  });
}

module.exports = {
  createReview,
  getMyBookingReview,
  listServiceReviews,
  listAdminReviews,
  updateReviewModeration,
};