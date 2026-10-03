import React, { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import {
  getAdminReviews,
  updateReviewModeration,
} from "../services/adminReviewService";

const PAGE_SIZE = 10;

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminReviewsPage() {
  const { token } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);

  const [selectedReview, setSelectedReview] = useState(null);
  const [reason, setReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      setIsLoading(true);
      setError("");
      setSelectedReview(null);

      try {
        const data = await getAdminReviews(token, {
          status: statusFilter,
          page,
          limit: PAGE_SIZE,
        });

        if (active) {
          setReviews(data.reviews);
          setMeta(data.meta);
        }
      } catch (error) {
        if (active) {
          setError(error.message || "Unable to load reviews.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      active = false;
    };
  }, [token, statusFilter, page, retry]);

  function chooseAction(review) {
    setSelectedReview(review);
    setReason("");
    setError("");
    setMessage("");
  }

  async function submitModeration(event) {
    event.preventDefault();

    if (!selectedReview || isUpdating) return;

    const nextStatus =
      selectedReview.moderation.status === "published"
        ? "hidden"
        : "published";

    setIsUpdating(true);
    setError("");
    setMessage("");

    try {
      const updated = await updateReviewModeration(
        token,
        selectedReview.id,
        {
          status: nextStatus,
          reason,
        }
      );

      setReviews((current) =>
        current.map((review) =>
          review.id === updated.id ? updated : review
        )
      );

      setMessage(
        nextStatus === "hidden"
          ? "Review has been hidden from public pages."
          : "Review has been restored to public pages."
      );

      setSelectedReview(null);
      setReason("");
    } catch (error) {
      setError(error.message || "Unable to update this review.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <section aria-labelledby="admin-reviews-title">
      <header className="page-heading">
        <p className="eyebrow">Admin workspace</p>
        <h1 id="admin-reviews-title">Review moderation</h1>
        <p className="intro">
          Hide inappropriate reviews or restore previously hidden reviews.
        </p>
      </header>

      {message && (
        <p className="form-success" role="status">
          {message}
        </p>
      )}

      {error && (
        <div className="form-error" role="alert">
          <p>{error}</p>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => setRetry((value) => value + 1)}
          >
            Reload reviews
          </button>
        </div>
      )}

      <div className="form-field booking-filter">
        <label htmlFor="admin-review-status">Moderation status</label>

        <select
          id="admin-review-status"
          value={statusFilter}
          disabled={isLoading || isUpdating}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All reviews</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      {isLoading ? (
        <p className="panel" role="status">
          Loading reviews...
        </p>
      ) : reviews.length === 0 ? (
        <section className="panel">
          <h2>No matching reviews</h2>
          <p>Try another moderation-status filter.</p>
        </section>
      ) : (
        <>
          <div className="booking-list">
            {reviews.map((review) => {
              const isSelected = selectedReview?.id === review.id;
              const isPublished =
                review.moderation.status === "published";

              return (
                <article className="booking-card" key={review.id}>
                  <div className="booking-card-header">
                    <div>
                      <h2>
                        {review.service?.title || "Unavailable service"}
                      </h2>

                      <p>
                        Customer:{" "}
                        {review.customer?.fullName || "Unavailable user"}
                      </p>
                    </div>

                    <span className="status-badge">
                      {isPublished ? "Published" : "Hidden"}
                    </span>
                  </div>

                  <p className="review-score">
                    {review.rating} out of 5
                  </p>

                  <p className="review-comment">
                    {review.comment || "No written comment provided."}
                  </p>

                  <p className="form-note">
                    Submitted {formatDate(review.createdAt)}
                  </p>

                  {review.moderation.reason && (
                    <p className="form-note">
                      Last moderation reason: {review.moderation.reason}
                    </p>
                  )}

                  {isSelected ? (
                    <form
                      className="booking-confirmation"
                      onSubmit={submitModeration}
                    >
                      <fieldset
                        className="profile-fields"
                        disabled={isUpdating}
                      >
                        <legend className="confirmation-title">
                          {isPublished
                            ? "Hide this review?"
                            : "Restore this review?"}
                        </legend>

                        <div className="form-field">
                          <label htmlFor={`reason-${review.id}`}>
                            Moderation reason
                          </label>

                          <textarea
                            id={`reason-${review.id}`}
                            rows={3}
                            maxLength={500}
                            value={reason}
                            onChange={(event) =>
                              setReason(event.target.value)
                            }
                          />

                          <small>
                            Optional. Maximum 500 characters.
                          </small>
                        </div>

                        <div className="form-actions">
                          <button
                            className={
                              isPublished
                                ? "button button--danger"
                                : "button"
                            }
                            type="submit"
                          >
                            {isUpdating ? "Saving..." : "Confirm"}
                          </button>

                          <button
                            className="button button--secondary"
                            type="button"
                            onClick={() => {
                              setSelectedReview(null);
                              setReason("");
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </fieldset>
                    </form>
                  ) : (
                    <button
                      className={
                        isPublished
                          ? "button button--secondary"
                          : "button"
                      }
                      type="button"
                      disabled={isUpdating}
                      onClick={() => chooseAction(review)}
                    >
                      {isPublished ? "Hide review" : "Restore review"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>

          {meta?.totalPages > 1 && (
            <nav className="pagination" aria-label="Review pages">
              <button
                className="button button--secondary"
                type="button"
                disabled={page === 1 || isUpdating}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>

              <span>
                Page {meta.page} of {meta.totalPages}
              </span>

              <button
                className="button button--secondary"
                type="button"
                disabled={page === meta.totalPages || isUpdating}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}