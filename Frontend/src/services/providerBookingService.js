import { apiRequest, ApiError } from "./api";

function invalidResponse(message) {
  return new ApiError(message, 502, "INVALID_RESPONSE");
}

function toProviderBooking(booking) {
  if (
    !booking ||
    typeof booking.id !== "string" ||
    typeof booking.serviceTitle !== "string" ||
    typeof booking.status !== "string"
  ) {
    throw invalidResponse("The server returned invalid booking data.");
  }

  return {
    ...booking,
    customerName: booking.customer?.fullName || "Customer",
    statusHistory: Array.isArray(booking.statusHistory)
      ? booking.statusHistory
      : [],
  };
}

export async function getProviderBookings(token) {
  const result = await apiRequest("/bookings", { token });

  if (!result || !Array.isArray(result.bookings)) {
    throw invalidResponse("The server returned invalid booking results.");
  }

  return result.bookings.map(toProviderBooking);
}

export async function updateProviderBookingStatus(
  token,
  bookingId,
  status,
  reason = ""
) {
  const booking = await apiRequest(
    `/bookings/${encodeURIComponent(bookingId)}/status`,
    {
      method: "PATCH",
      token,
      body: {
        status,
        reason: reason.trim(),
      },
    }
  );

  return toProviderBooking(booking);
}