import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAdminBookings } from "../services/adminBookingService";

const PAGE_SIZE = 4;

const BOOKING_STATUSES = [
  "pending",
  "accepted",
  "in_progress",
  "completed",
  "cancelled",
  "rejected",
];

function label(value) {
  const text = value.replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function formatMoney(amount, currency) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
  }).format(amount);
}

export default function AdminBookingsPage() {
  const { user: admin } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;

    setIsLoading(true);
    setError("");

    getAdminBookings(admin)
      .then((records) => {
        if (active) setBookings(records);
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Could not load platform bookings.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [admin, retry]);

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setPaymentFilter("");
    setPage(1);
  }

  const query = search.trim().toLowerCase();

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      !query ||
      [
        booking.id,
        booking.serviceTitle,
        booking.customerName,
        booking.providerName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

    return (
      matchesSearch &&
      (!statusFilter || booking.status === statusFilter) &&
      (!paymentFilter || booking.paymentStatus === paymentFilter)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBookings.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleBookings = filteredBookings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <section>
      <header className="page-heading">
        <p className="eyebrow">Admin workspace</p>
        <h1>Platform bookings</h1>
        <p className="intro">
          Review customer bookings and their current service and payment
          statuses.
        </p>
      </header>

      <div className="demo-notice">
        Demo mode: these fixed sample records are separate from the customer
        and provider booking pages. No real payments or bookings are loaded.
        Dates are shown in Lagos time.
      </div>

      <fieldset
        className="admin-filters"
        disabled={isLoading || Boolean(error)}
      >
        <legend className="sr-only">Filter platform bookings</legend>

        <div className="form-field">
          <label htmlFor="admin-booking-search">Search bookings</label>
          <input
            id="admin-booking-search"
            type="search"
            placeholder="ID, service, customer, or provider"
            value={search}
            onChange={(event) =>
              changeFilter(setSearch, event.target.value)
            }
          />
        </div>

        <div className="form-field">
          <label htmlFor="admin-booking-status">Booking status</label>
          <select
            id="admin-booking-status"
            value={statusFilter}
            onChange={(event) =>
              changeFilter(setStatusFilter, event.target.value)
            }
          >
            <option value="">All booking statuses</option>
            {BOOKING_STATUSES.map((status) => (
              <option key={status} value={status}>
                {label(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="admin-booking-payment">Payment status</label>
          <select
            id="admin-booking-payment"
            value={paymentFilter}
            onChange={(event) =>
              changeFilter(setPaymentFilter, event.target.value)
            }
          >
            <option value="">All payment statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <button
          className="button button--secondary"
          type="button"
          onClick={clearFilters}
        >
          Clear filters
        </button>
      </fieldset>

      {isLoading ? (
        <p role="status">Loading platform bookings...</p>
      ) : error ? (
        <div className="panel">
          <p className="form-error" role="alert">
            {error}
          </p>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="panel">
          <h2>No matching bookings</h2>
          <p>Try another search or clear your filters.</p>
        </div>
      ) : (
        <>
          <p role="status">
            {filteredBookings.length} matching booking
            {filteredBookings.length === 1 ? "" : "s"}
          </p>

          <div className="admin-booking-list">
            {visibleBookings.map((booking) => (
              <article className="panel admin-booking-card" key={booking.id}>
                <header className="admin-booking-card__header">
                  <div>
                    <p className="eyebrow">{booking.id}</p>
                    <h2>{booking.serviceTitle}</h2>
                  </div>
                  <span className="status-badge">
                    {label(booking.status)}
                  </span>
                </header>

                <dl className="admin-booking-details">
                  <div>
                    <dt>Customer</dt>
                    <dd>{booking.customerName}</dd>
                  </div>
                  <div>
                    <dt>Provider</dt>
                    <dd>{booking.providerName}</dd>
                  </div>
                  <div>
                    <dt>Scheduled for</dt>
                    <dd>{formatDate(booking.scheduledAt)}</dd>
                  </div>
                  <div>
                    <dt>Agreed price</dt>
                    <dd>
                      {formatMoney(booking.agreedPrice, booking.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt>Payment status</dt>
                    <dd>{label(booking.paymentStatus)}</dd>
                  </div>
                </dl>

                <details className="admin-booking-extra">
                  <summary>View booking details</summary>

                  <dl className="admin-booking-details">
                    <div>
                      <dt>Service address</dt>
                      <dd>{booking.serviceAddress}</dd>
                    </div>
                    <div>
                      <dt>Created</dt>
                      <dd>{formatDate(booking.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>Customer note</dt>
                      <dd>{booking.customerNote || "No note provided."}</dd>
                    </div>
                  </dl>
                </details>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Platform booking pages">
              <button
                className="button button--secondary"
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="button button--secondary"
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
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