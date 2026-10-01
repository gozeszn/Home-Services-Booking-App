import React, { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../utils/formatPrice";
import {
  getProviderBookings,
  updateProviderBookingStatus,
} from "../services/providerBookingService";

const statusLabels = {
  pending: "Pending",
  accepted: "Accepted",
  in_progress: "In progress",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const actionsByStatus = {
  pending: [
    { status: "accepted", label: "Accept request" },
    { status: "rejected", label: "Reject request" },
  ],
  accepted: [
    { status: "in_progress", label: "Start work" },
  ],
  in_progress: [
    { status: "completed", label: "Mark completed" },
  ],
};

const confirmationMessages = {
  accepted: "Accept this service request?",
  rejected: "Reject this service request?",
  in_progress: "Confirm that work has started?",
  completed: "Confirm that this service has been completed?",
};

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ProviderBookingsPage() {
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  const [filter, setFilter] = useState("");
  const [selectedAction, setSelectedAction] = useState(null);
  const [reason, setReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBookings() {
      setIsLoading(true);
      setLoadFailed(false);
      setError("");

      try {
        const data = await getProviderBookings(user.id);

        if (active) setBookings(data);
      } catch (error) {
        if (active) {
          setLoadFailed(true);
          setError(error.message || "Unable to load requests.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadBookings();

    return () => {
      active = false;
    };
  }, [user.id, retry]);

  function selectAction(bookingId, status) {
    setSelectedAction({ bookingId, status });
    setReason("");
    setError("");
    setMessage("");
  }

  function closeConfirmation() {
    setSelectedAction(null);
    setReason("");
  }

  async function confirmAction(event) {
    event.preventDefault();

    if (!selectedAction || isUpdating) return;

    setIsUpdating(true);
    setError("");
    setMessage("");

    try {
      const updated = await updateProviderBookingStatus(
        user.id,
        selectedAction.bookingId,
        selectedAction.status,
        selectedAction.status === "rejected" ? reason : ""
      );

      setBookings((previous) =>
        previous.map((booking) =>
          booking.id === updated.id ? updated : booking
        )
      );

      setMessage(
        `Booking for ${updated.customerName} is now ${
          statusLabels[updated.status]
        }.`
      );

      closeConfirmation();
    } catch (error) {
      setError(error.message || "Unable to update this booking.");
    } finally {
      setIsUpdating(false);
    }
  }

  const visibleBookings = bookings.filter(
    (booking) => !filter || booking.status === filter
  );

  return (
    <section aria-labelledby="provider-bookings-title">
      <div className="page-heading">
        <p className="eyebrow">Provider workspace</p>
        <h1 id="provider-bookings-title">Booking requests</h1>

        <p className="intro">
          Review requests and manage your accepted work.
        </p>
      </div>

      <p className="demo-notice">
        These are fictional requests for testing. Changes stay
        in this browser tab and do not affect customer accounts,
        send notifications, or take payments.
      </p>

      {error && (
        <p className="form-error" role="alert">{error}</p>
      )}

      {message && (
        <p className="form-success" role="status">{message}</p>
      )}

      <div className="form-field booking-filter">
        <label htmlFor="provider-booking-status">
          Filter by status
        </label>

        <select
          id="provider-booking-status"
          value={filter}
          disabled={isLoading || isUpdating}
          onChange={(event) => {
            setFilter(event.target.value);
            closeConfirmation();
          }}
        >
          <option value="">All requests</option>

          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="panel" role="status">
          Loading booking requests...
        </p>
      ) : loadFailed ? (
        <button
          className="button"
          type="button"
          onClick={() => setRetry((value) => value + 1)}
        >
          Try again
        </button>
      ) : visibleBookings.length === 0 ? (
        <section className="panel">
          <h2>No matching requests</h2>
          <p>Choose another status to view your demo bookings.</p>
        </section>
      ) : (
        <div className="booking-list">
          {visibleBookings.map((booking) => {
            const actions = actionsByStatus[booking.status] || [];

            const isSelected =
              selectedAction?.bookingId === booking.id;

            return (
              <article className="booking-card" key={booking.id}>
                <div className="booking-card-header">
                  <div>
                    <h2>{booking.serviceTitle}</h2>
                    <p>{booking.customerName}</p>
                  </div>

                  <span className="status-badge">
                    {statusLabels[booking.status]}
                  </span>
                </div>

                <dl className="booking-details">
                  <div>
                    <dt>Requested appointment</dt>
                    <dd>{formatDate(booking.scheduledAt)}</dd>
                  </div>

                  <div>
                    <dt>Agreed price</dt>
                    <dd>
                      {formatPrice(
                        booking.agreedPrice,
                        booking.currency
                      )}
                      {" / "}
                      {booking.pricingUnit}
                    </dd>
                  </div>

                  <div>
                    <dt>Service address</dt>
                    <dd>{booking.serviceAddress}</dd>
                  </div>

                  <div>
                    <dt>Payment status</dt>
                    <dd>{booking.paymentStatus}</dd>
                  </div>

                  {booking.customerNote && (
                    <div>
                      <dt>Customer note</dt>
                      <dd>{booking.customerNote}</dd>
                    </div>
                  )}
                </dl>

                {isSelected ? (
                  <form
                    className="booking-confirmation"
                    onSubmit={confirmAction}
                  >
                    <fieldset
                      className="profile-fields"
                      disabled={isUpdating}
                    >
                      <legend className="confirmation-title">
                        {confirmationMessages[selectedAction.status]}
                      </legend>

                      {selectedAction.status === "rejected" && (
                        <div className="form-field">
                          <label htmlFor={`reason-${booking.id}`}>
                            Reason for rejection
                          </label>

                          <textarea
                            id={`reason-${booking.id}`}
                            rows={3}
                            maxLength={500}
                            value={reason}
                            onChange={(event) =>
                              setReason(event.target.value)
                            }
                            aria-describedby={`reason-hint-${booking.id}`}
                          />

                          <small id={`reason-hint-${booking.id}`}>
                            Optional. Maximum 500 characters.
                          </small>
                        </div>
                      )}

                      <div className="form-actions">
                        <button
                          className={
                            selectedAction.status === "rejected"
                              ? "button button--danger"
                              : "button"
                          }
                          type="submit"
                        >
                          {isUpdating ? "Updating..." : "Confirm"}
                        </button>

                        <button
                          className="button button--secondary"
                          type="button"
                          onClick={closeConfirmation}
                        >
                          Go back
                        </button>
                      </div>
                    </fieldset>
                  </form>
                ) : actions.length > 0 ? (
                  <div className="form-actions">
                    {actions.map((action) => (
                      <button
                        key={action.status}
                        className={
                          action.status === "rejected"
                            ? "button button--secondary"
                            : "button"
                        }
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          selectAction(booking.id, action.status)
                        }
                        aria-label={`${action.label} for ${booking.customerName}`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="form-note">
                    No further actions are available for this booking.
                  </p>
                )}

                {booking.statusHistory.length > 0 && (
                  <details className="booking-history">
                    <summary>View status history</summary>

                    <ol>
                      {booking.statusHistory.map((entry, index) => (
                        <li key={`${entry.changedAt}-${index}`}>
                          <strong>
                            {statusLabels[entry.from]}
                            {" → "}
                            {statusLabels[entry.to]}
                          </strong>

                          <p>{formatDate(entry.changedAt)}</p>

                          {entry.reason && (
                            <p>Reason: {entry.reason}</p>
                          )}
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}