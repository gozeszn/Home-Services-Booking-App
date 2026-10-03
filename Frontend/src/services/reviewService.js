import { apiRequest, ApiError } from "./api";

function invalidResponse(message) {
  return new ApiError(message, 502, "INVALID_RESPONSE");
}

function assertReview(review) {
  if (
    !review ||
    typeof review.id !== "string" ||
    typeof review.bookingId !== "string" ||
    !Number.isInteger(review.rating) ||
    review.rating < 1 ||
    review.rating > 5
  ) {
    throw invalidResponse("The server returned invalid review data.");
  }

  return review;
}

export async function getBookingReview(token, bookingId) {
  const review = await apiRequest(
    `/bookings/${encodeURIComponent(bookingId)}/review`,
    { token }
  );

  return review === null ? null : assertReview(review);
}

export async function createBookingReview(
  token,
  bookingId,
  { rating, comment }
) {
  const review = await apiRequest(
    `/bookings/${encodeURIComponent(bookingId)}/review`,
    {
      method: "POST",
      token,
      body: {
        rating: Number(rating),
        comment: comment.trim(),
      },
    }
  );

  return assertReview(review);
}

export async function getServiceReviews(
  serviceId,
  { page = 1, limit = 10, signal } = {}
) {
  const result = await apiRequest(
    `/services/${encodeURIComponent(serviceId)}/reviews?page=${page}&limit=${limit}`,
    { signal }
  );

  if (
    !result ||
    !Array.isArray(result.reviews) ||
    !result.meta
  ) {
    throw invalidResponse("The server returned invalid review results.");
  }

  return result;
}