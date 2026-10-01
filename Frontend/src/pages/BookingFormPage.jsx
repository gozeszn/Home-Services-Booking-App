import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getService } from "../services/serviceService";
import { createBooking } from "../services/bookingService";
import { formatPrice } from "../utils/formatPrice";

export default function BookingFormPage() {
  const { serviceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState({
    scheduledAt: "",
    serviceAddress: "",
    customerNote: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadService() {
      setIsLoading(true);
      setLoadError("");

      try {
        const result = await getService(serviceId);

        if (active) {
          setService(result);
        }
      } catch {
        if (active) {
          setLoadError("This service is currently unavailable.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadService();

    return () => {
      active = false;
    };
  }, [serviceId]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    const scheduledAt = new Date(form.scheduledAt);

    if (
      !Number.isFinite(scheduledAt.getTime()) ||
      scheduledAt.getTime() <= Date.now()
    ) {
      setError("Choose a future date and time.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await createBooking(user.id, {
        serviceId,
        scheduledAt: scheduledAt.toISOString(),
        serviceAddress: form.serviceAddress,
        customerNote: form.customerNote,
      });

      navigate("/bookings", {
        replace: true,
        state: {
          message: "Your demo booking has been created.",
        },
      });
    } catch (error) {
      setError(error.message || "Unable to create your booking.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="panel" role="status">
        Loading service...
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="panel">
        <h1>Service unavailable</h1>
        <p role="alert">{loadError}</p>
        <Link to="/services">Browse other services</Link>
      </section>
    );
  }

  return (
    <section className="panel profile-panel">
      <Link to={`/services/${serviceId}`}>
        ← Back to service
      </Link>

      <p className="eyebrow booking-eyebrow">
        Request a service
      </p>

      <h1>Book {service.title}</h1>

      <p>
        {service.provider.displayName} · {service.location}
      </p>

      <p className="service-price">
        <strong>
          {formatPrice(service.price, service.currency)}
        </strong>
        <span> / {service.pricingUnit}</span>
      </p>

      <p className="demo-notice">
        This creates a demo booking in this browser tab.
        No provider will be contacted and no payment will be taken.
        Use a sample address.
      </p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <fieldset
          className="profile-fields"
          disabled={isSubmitting}
        >
          <legend className="sr-only">Booking details</legend>

          <div className="form-field">
            <label htmlFor="booking-date">
              Preferred date and time
            </label>

            <input
              id="booking-date"
              name="scheduledAt"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={handleChange}
              aria-describedby="booking-time-hint"
              required
            />

            <small id="booking-time-hint">
              Times use your device’s local time zone.
              Your requested slot is subject to provider confirmation.
            </small>
          </div>

          <div className="form-field">
            <label htmlFor="booking-address">
              Service address
            </label>

            <textarea
              id="booking-address"
              name="serviceAddress"
              rows={3}
              minLength={10}
              maxLength={300}
              value={form.serviceAddress}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="booking-note">
              Additional information
            </label>

            <textarea
              id="booking-note"
              name="customerNote"
              rows={4}
              maxLength={1000}
              value={form.customerNote}
              onChange={handleChange}
            />

            <small>
              Optional. Describe anything the provider should know.
            </small>
          </div>

          <button
            className="button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Creating booking..."
              : "Create demo booking"}
          </button>
        </fieldset>
      </form>
    </section>
  );
}