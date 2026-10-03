import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getMyBookings } from "../services/bookingService";
import {
  getBookingReview,
  createBookingReview,
} from "../services/reviewService";

const ratingLabels = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very good",
  5: "Excellent",
};

export default function BookingReviewPage() {
  const { bookingId } = useParams();
  const { token } = useAuth();

  const [booking, setBooking] = useState(null);
  const [review, setReview] = useState(null);
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadReview() {
      setIsLoading(true);
      setLoadError("");
      setError("");
      setMessage("");
      setBooking(null);
      setReview(null);
      setRating("");
      setComment("");

      try {
        const [bookings, existingReview] = await Promise.all([
          getMyBookings(token),
          getBookingReview(token, bookingId),
        ]);

        const selected = bookings.find(
          (item) => item.id === bookingId
        );

        if (!selected) {
          throw new Error("This booking could not be found.");
        }

        if (active) {
          setBooking(selected);
          setReview(existingReview);
        }
      } catch (error) {
        if (active) {
          setLoadError(error.message || "Unable to load this booking.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadReview();

    return () => {
      active = false;
    };
  }, [token, bookingId, retry]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSaving) return;

    setIsSaving(true);
    setError("");

    try {
      const saved = await createBookingReview(
        token,
        bookingId,
        { rating, comment }
      );

      setReview(saved);
      setMessage("Your review has been saved.");
    } catch (error) {
      setError(error.message || "Unable to save your review.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="panel" role="status">
        Loading booking...
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="panel">
        <h1>Review unavailable</h1>
        <p className="form-error" role="alert">{loadError}</p>

        <div className="form-actions">
          <button
            className="button"
            type="button"
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again
          </button>

          <Link to="/bookings">Back to my bookings</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="panel profile-panel">
      <Link to="/bookings">← Back to my bookings</Link>

      <p className="eyebrow booking-eyebrow">
        Your service experience
      </p>

      <h1>{review ? "Your review" : "Review your booking"}</h1>

      <h2>{booking.serviceTitle}</h2>
      <p>{booking.providerName}</p>

      <p className="form-note">
        Your review is published publicly and may be moderated if it
        does not follow platform guidelines.
      </p>

      {message && (
        <p className="form-success" role="status">{message}</p>
      )}

      {error && (
        <p className="form-error" role="alert">{error}</p>
      )}

      {review ? (
        <div className="saved-review">
          <p className="review-score">
            {review.rating} out of 5
            {" — "}
            {ratingLabels[review.rating]}
          </p>

          <p className="review-comment">
            {review.comment || "No written comment provided."}
          </p>

          <p className="form-note">
            Submitted{" "}
            {new Date(review.createdAt).toLocaleDateString()}.
            Only one review is allowed per booking.
          </p>
        </div>
      ) : booking.status !== "completed" ? (
        <p className="form-note">
          You can review this booking after it has been completed.
        </p>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <fieldset className="profile-fields" disabled={isSaving}>
            <legend className="sr-only">Your review</legend>

            <fieldset className="rating-fieldset">
              <legend>How was the service?</legend>

              <div className="rating-options">
                {Object.entries(ratingLabels).map(([value, label]) => (
                  <label className="rating-option" key={value}>
                    <input
                      type="radio"
                      name="rating"
                      value={value}
                      checked={rating === value}
                      onChange={(event) => {
                        setRating(event.target.value);
                        setError("");
                      }}
                      required
                    />
                    <span>
                      <strong>{value}</strong>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="form-field">
              <label htmlFor="review-comment">
                Tell us about your experience
              </label>

              <textarea
                id="review-comment"
                rows={5}
                maxLength={1000}
                value={comment}
                onChange={(event) => {
                  setComment(event.target.value);
                  setError("");
                }}
                aria-describedby="review-comment-hint"
              />

              <small id="review-comment-hint">
                Optional. {comment.length}/1,000 characters.
              </small>
            </div>

            <button className="button" type="submit">
              {isSaving ? "Submitting..." : "Submit review"}
            </button>
          </fieldset>
        </form>
      )}
    </section>
  );
}