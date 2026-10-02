import { apiRequest, ApiError } from "./api";

export const USING_MOCK_BOOKINGS = false;

function invalidResponse(message) {
  return new ApiError(message, 502, "INVALID_RESPONSE");
}

function assertBooking(booking) {
  if (
    !booking ||
    typeof booking.id !== "string" ||
    typeof booking.serviceId !== "string" ||
    typeof booking.serviceTitle !== "string" ||
    typeof booking.providerName !== "string" ||
    typeof booking.status !== "string"
  ) {
    throw invalidResponse("The server returned invalid booking data.");
  }

  return booking;
}

export async function getMyBookings(token) {
  const result = await apiRequest("/bookings", { token });

  if (!result || !Array.isArray(result.bookings)) {
    throw invalidResponse("The server returned invalid booking results.");
  }

  return result.bookings.map(assertBooking);
}

export async function createBooking(token, details) {
  const booking = await apiRequest("/bookings", {
    method: "POST",
    token,
    body: {
      serviceId: details.serviceId,
      scheduledAt: details.scheduledAt,
      serviceAddress: details.serviceAddress.trim(),
      customerNote: details.customerNote.trim(),
    },
  });

  return assertBooking(booking);
}

export async function cancelBooking(token, bookingId) {
  const booking = await apiRequest(
    `/bookings/${encodeURIComponent(bookingId)}/status`,
    {
      method: "PATCH",
      token,
      body: {
        status: "cancelled",
      },
    }
  );

  return assertBooking(booking);
}

export async function getBookingPayment(token, bookingId) {
  return apiRequest(
    `/bookings/${encodeURIComponent(bookingId)}/payment`,
    { token }
  );
}

export async function makeTestPayment(token, bookingId) {
  return apiRequest(
    `/bookings/${encodeURIComponent(bookingId)}/payments`,
    {
      method: "POST",
      token,
      body: {
        method: "test",
        confirm: true,
      },
    }
  );
}