import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import {
  getMyBookings,
  cancelBooking,
  addCompletedDemoBooking,
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
  const { user } = useAuth();
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
  const [isAddingDemo, setIsAddingDemo] = useState(false);

  async function handleAddCompletedDemo() {
    if (isAddingDemo || isCancelling) return;

    setIsAddingDemo(true);
    setError("");
    setMessage("");

    try {
      const booking = await addCompletedDemoBooking(user.id);

      setBookings((previous) =>
        previous.some((item) => item.id === booking.id)
          ? previous
          : [booking, ...previous]
      );

      setStatusFilter("completed");
      setMessage("The completed sample booking is ready to review.");
    } catch (error) {
      setError(error.message || "Unable to add the sample booking.");
    } finally {
      setIsAddingDemo(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadBookings() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getMyBookings(user.id);

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
  }, [user.id, retry]);

  async function handleCancel(bookingId) {
    if (isCancelling) return;

    setIsCancelling(true);
    setError("");
    setMessage("");

    try {
      const updated = await cancelBooking(user.id, bookingId);

      setBookings((previous) =>
        previous.map((booking) =>
          booking.id === bookingId ? updated : booking
        )
      );

      setConfirmId(null);
      setMessage("Your demo booking has been cancelled.");
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

      <p className="demo-notice">
        Demo bookings are stored in this browser tab for your
        account. They are not shared with providers or other devices.
      </p>

      <button
        className="button button--secondary"
        type="button"
        disabled={isAddingDemo || isLoading || isCancelling}
        onClick={handleAddCompletedDemo}
      >
        {isAddingDemo
          ? "Adding sample..."
          : "Add completed demo booking"}
      </button>

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
          <p>Explore services to create your first demo booking.</p>
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

                {canCancel && (
                  confirmId === booking.id ? (
                    <div className="cancel-confirmation">
                      <p>Cancel this demo booking?</p>

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