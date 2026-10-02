import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import {
  getMyBookings,
  cancelBooking,
  makeTestPayment,

} from "../services/bookingService";
import { formatPrice } from "../utils/formatPrice";

const statusLabels = {
  pending: "Pending confirmation",
  accepted: "Accepted",
  in_progress: "In progress",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function MyBookingsPage() {
  const { token } = useAuth();
  const location = useLocation();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    location.state?.message || ""
  );

  const [statusFilter, setStatusFilter] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [retry, setRetry] = useState(0);
  const [isPayingId, setIsPayingId] = useState(null);


  useEffect(() => {
    let active = true;

    async function loadBookings() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getMyBookings(token);

        if (active) {
          setBookings(data);
        }
      } catch (error) {
        if (active) {
          setError(error.message || "Unable to load bookings.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      active = false;
    };
  }, [token, retry]);

  async function handleTestPayment(bookingId) {
    if (isPayingId || isCancelling) return;

    setIsPayingId(bookingId);
    setError("");
    setMessage("");

    try {
      const result = await makeTestPayment(token, bookingId);

      setBookings((previous) =>
        previous.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                paymentStatus: result.paymentStatus,
              }
            : booking
        )
      );

      setMessage("Payment recorded successfully.");
    } catch (error) {
      setError(error.message || "Unable to record the payment.");
    } finally {
      setIsPayingId(null);
    }
  }

  async function handleCancel(bookingId) {
    if (isCancelling) return;

    setIsCancelling(true);
    setError("");
    setMessage("");

    try {
      const updated = await cancelBooking(token, bookingId);

      setBookings((previous) =>
        previous.map((booking) =>
          booking.id === bookingId ? updated : booking
        )
      );

      setConfirmId(null);
      setMessage("Your booking has been cancelled.");
    } catch (error) {
      setError(error.message || "Unable to cancel this booking.");
    } finally {
      setIsCancelling(false);
    }
  }

  const visibleBookings = bookings.filter(
    (booking) =>
      !statusFilter || booking.status === statusFilter
  );

  return (
    <section aria-labelledby="bookings-title">
      <div className="page-heading">
        <p className="eyebrow">Customer workspace</p>
        <h1 id="bookings-title">My bookings</h1>
        <p className="intro">
          Review your service requests and appointments.
        </p>
      </div>


      

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
            disabled={isLoading || isCancelling}
            onClick={() => setRetry((value) => value + 1)}
          >
            Reload bookings
          </button>
        </div>
      )}

      <div className="form-field booking-filter">
        <label htmlFor="booking-status">Filter by status</label>

        <select
          id="booking-status"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setConfirmId(null);
          }}
          disabled={isCancelling}
        >
          <option value="">All bookings</option>

          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="panel" role="status">
          Loading bookings...
        </p>
      ) : visibleBookings.length === 0 ? (
        <div className="panel">
          <h2>
            {statusFilter
              ? "No bookings with this status"
              : "No bookings yet"}
          </h2>
          <p>Explore services to create your first booking request.</p>
          <Link className="button" to="/services">
            Find services
          </Link>
        </div>
      ) : (
        <div className="booking-list">
          {visibleBookings.map((booking) => {
            const canCancel = ["pending", "accepted"].includes(
              booking.status
            );
            const canPay =
              booking.paymentStatus === "unpaid" &&
              !["cancelled", "rejected"].includes(booking.status);

            return (
              <article className="booking-card" key={booking.id}>
                <div className="booking-card-header">
                  <div>
                    <h2>
                      <Link to={`/services/${booking.serviceId}`}>
                        {booking.serviceTitle}
                      </Link>
                    </h2>
                    <p>{booking.providerName}</p>
                  </div>

                  <span className="status-badge">
                    {statusLabels[booking.status] || booking.status}
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
                    <dt>Address</dt>
                    <dd>{booking.serviceAddress}</dd>
                  </div>

                  <div>
                    <dt>Payment status</dt>
                    <dd>{booking.paymentStatus}</dd>
                  </div>

                  {booking.customerNote && (
                    <div>
                      <dt>Your note</dt>
                      <dd>{booking.customerNote}</dd>
                    </div>
                  )}
                </dl>

                {booking.status === "completed" && (
                  <Link
                    className="button"
                    to={`/bookings/${booking.id}/review`}
                  >
                    Write or view review
                  </Link>
                )}

                {canPay && (
                  <button
                    className="button"
                    type="button"
                    disabled={Boolean(isPayingId) || isCancelling}
                    onClick={() => handleTestPayment(booking.id)}
                  >
                    {isPayingId === booking.id
                      ? "Recording payment..."
                      : "Make payment"}
                  </button>
                )}

                {canCancel && (
                  confirmId === booking.id ? (
                    <div className="cancel-confirmation">
                      <p>Cancel this booking request?</p>

                      <div className="form-actions">
                        <button
                          className="button button--danger"
                          type="button"
                          disabled={isCancelling}
                          onClick={() => handleCancel(booking.id)}
                        >
                          {isCancelling
                            ? "Cancelling..."
                            : "Yes, cancel booking"}
                        </button>

                        <button
                          className="button button--secondary"
                          type="button"
                          disabled={isCancelling}
                          onClick={() => setConfirmId(null)}
                        >
                          Keep booking
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="button button--secondary"
                      type="button"
                      disabled={isCancelling}
                      onClick={() => setConfirmId(booking.id)}
                    >
                      Cancel booking
                    </button>
                  )
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}