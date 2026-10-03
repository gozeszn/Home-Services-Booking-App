const express = require("express");

const reviewController = require("../controllers/reviewController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const {
  reviewParamsSchema,
  bookingReviewParamsSchema,
  serviceReviewParamsSchema,
  createReviewSchema,
  reviewListQuerySchema,
  adminReviewListQuerySchema,
  moderationSchema,
} = require("../validators/reviewSchemas");

const router = express.Router();

// Customer review for one of their bookings.
router.post(
  "/bookings/:bookingId/review",
  authenticate,
  authorize("customer"),
  validate({
    params: bookingReviewParamsSchema,
    body: createReviewSchema,
  }),
  reviewController.createReview
);

router.get(
  "/bookings/:bookingId/review",
  authenticate,
  authorize("customer"),
  validate({
    params: bookingReviewParamsSchema,
  }),
  reviewController.getMyBookingReview
);

// Public reviews shown on a service details page.
router.get(
  "/services/:serviceId/reviews",
  validate({
    params: serviceReviewParamsSchema,
    query: reviewListQuerySchema,
  }),
  reviewController.listServiceReviews
);

// Administration review moderation.
router.get(
  "/admin/reviews",
  authenticate,
  authorize("admin"),
  validate({
    query: adminReviewListQuerySchema,
  }),
  reviewController.listAdminReviews
);

router.patch(
  "/admin/reviews/:reviewId/moderation",
  authenticate,
  authorize("admin"),
  validate({
    params: reviewParamsSchema,
    body: moderationSchema,
  }),
  reviewController.updateReviewModeration
);

module.exports = router;