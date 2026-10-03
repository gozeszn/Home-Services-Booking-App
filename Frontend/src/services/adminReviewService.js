import { apiRequest, ApiError } from "./api";

function invalidResponse(message) {
  return new ApiError(message, 502, "INVALID_RESPONSE");
}

export async function getAdminReviews(
  token,
  { status = "", page = 1, limit = 10 } = {}
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (status) {
    params.set("status", status);
  }

  const result = await apiRequest(
    `/admin/reviews?${params.toString()}`,
    { token }
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

export async function updateReviewModeration(
  token,
  reviewId,
  { status, reason }
) {
  return apiRequest(
    `/admin/reviews/${encodeURIComponent(reviewId)}/moderation`,
    {
      method: "PATCH",
      token,
      body: {
        status,
        reason: reason.trim(),
      },
    }
  );
}