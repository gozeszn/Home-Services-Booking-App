const express = require("express");

const bookingController = require("../controllers/bookingController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const {
  createBookingSchema,
  bookingStatusSchema,
  bookingListQuerySchema,
  bookingParamsSchema,
  paymentSchema,
} = require("../validators/bookingSchemas");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("customer"),
  validate({
    body: createBookingSchema,
  }),
  bookingController.createBooking
);

router.get(
  "/",
  authenticate,
  validate({
    query: bookingListQuerySchema,
  }),
  bookingController.listMyBookings
);

router.post(
  "/:bookingId/payments",
  authenticate,
  authorize("customer"),
  validate({
    params: bookingParamsSchema,
    body: paymentSchema,
  }),
  bookingController.createTestPayment
);

router.get(
  "/:bookingId/payment",
  authenticate,
  validate({
    params: bookingParamsSchema,
  }),
  bookingController.getPayment
);

router.patch(
  "/:bookingId/status",
  authenticate,
  validate({
    params: bookingParamsSchema,
    body: bookingStatusSchema,
  }),
  bookingController.updateBookingStatus
);

router.get(
  "/:bookingId",
  authenticate,
  validate({
    params: bookingParamsSchema,
  }),
  bookingController.getBooking
);

module.exports = router;