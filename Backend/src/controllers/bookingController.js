const bookingService = require("../services/bookingService");

async function createBooking(req, res) {
  const data = await bookingService.createBooking({
    customer: req.user,
    ...req.validated.body,
  });

  return res.status(201).json({
    success: true,
    data,
  });
}

async function listMyBookings(req, res) {
  const data = await bookingService.listMyBookings({
    user: req.user,
    ...req.validated.query,
  });

  return res.status(200).json({
    success: true,
    data,
    meta: data.meta,
  });
}

async function getBooking(req, res) {
  const data = await bookingService.getBooking({
    bookingId: req.validated.params.bookingId,
    user: req.user,
  });

  return res.status(200).json({
    success: true,
    data,
  });
}

async function updateBookingStatus(req, res) {
  const data = await bookingService.updateBookingStatus({
    bookingId: req.validated.params.bookingId,
    user: req.user,
    ...req.validated.body,
  });

  return res.status(200).json({
    success: true,
    data,
  });
}

async function createTestPayment(req, res) {
  const data = await bookingService.createTestPayment({
    bookingId: req.validated.params.bookingId,
    customer: req.user,
  });

  return res.status(201).json({
    success: true,
    data,
  });
}

async function getPayment(req, res) {
  const data = await bookingService.getPayment({
    bookingId: req.validated.params.bookingId,
    user: req.user,
  });

  return res.status(200).json({
    success: true,
    data,
  });
}

module.exports = {
  createBooking,
  listMyBookings,
  getBooking,
  updateBookingStatus,
  createTestPayment,
  getPayment,
};