import { getMyBookings } from "./bookingService";

const PREFIX = "homeServices.demoReviews.";

function storageKey(userId) {
  if (!userId) {
    throw new Error("Please log in to manage reviews.");
  }

  return `${PREFIX}${userId}`;
}

function readReviews(userId) {
  const key = storageKey(userId);

  try {
    const saved = sessionStorage.getItem(key);
    const reviews = saved ? JSON.parse(saved) : [];

    if (
      !Array.isArray(reviews) ||
      reviews.some((review) => review.customerId !== userId)
    ) {
      throw new Error("Invalid stored reviews");
    }

    return reviews;
  } catch {
    throw new Error("Unable to read your demo reviews.");
  }
}

export async function getBookingReview(userId, bookingId) {
  return (
    readReviews(userId).find(
      (review) => review.bookingId === bookingId
    ) || null
  );
}

export async function createBookingReview(
  userId,
  bookingId,
  { rating, comment }
) {
  const bookings = await getMyBookings(userId);

  const booking = bookings.find(
    (item) =>
      item.id === bookingId &&
      item.customerId === userId
  );

  if (!booking) {
    throw new Error("This booking could not be found.");
  }

  if (booking.status !== "completed") {
    throw new Error("Only completed bookings can be reviewed.");
  }

  const score = Number(rating);
  const trimmedComment = comment.trim();

  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error("Choose a rating between 1 and 5.");
  }

  if (trimmedComment.length > 1000) {
    throw new Error("Your comment must not exceed 1,000 characters.");
  }

  // Check immediately before writing, after the asynchronous booking lookup.
  const reviews = readReviews(userId);

  if (reviews.some((review) => review.bookingId === bookingId)) {
    throw new Error("You have already reviewed this booking.");
  }

  const review = {
    id: crypto.randomUUID(),
    bookingId,
    serviceId: booking.serviceId,
    customerId: userId,
    rating: score,
    comment: trimmedComment,
    createdAt: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(
      storageKey(userId),
      JSON.stringify([review, ...reviews])
    );
  } catch {
    throw new Error(
      "Unable to save your review. Check that browser storage is available."
    );
  }

  return review;
}