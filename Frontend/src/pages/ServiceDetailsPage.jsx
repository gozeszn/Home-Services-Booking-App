import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getService,
  USING_MOCK_SERVICES,
} from "../services/serviceService";
import { formatPrice } from "../utils/formatPrice";
import { useAuth } from "../context/AuthContext";

import { getServiceReviews } from "../services/reviewService";

export default function ServiceDetailsPage() {
  const { serviceId } = useParams();
  const { user, isLoading: isCheckingSession } = useAuth();

  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadService() {
      setIsLoading(true);
      setError("");
      setService(null);

      try {
        const [serviceData, reviewData] = await Promise.all([
          getService(serviceId),
          getServiceReviews(serviceId),
        ]);

        if (active) {
          setService(serviceData);
          setReviews(reviewData.reviews);
        }
      } catch (error) {
        if (active) {
          setError(
            error.status === 404
              ? "This service could not be found."
              : "Unable to load this service. Please try again."
          );
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
  }, [serviceId, retry]);

  if (isLoading) {
    return (
      <section className="panel" role="status">
        Loading service...
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">
        <h1>Service unavailable</h1>
        <p role="alert">{error}</p>

        <div className="form-actions">
          <button
            className="button"
            type="button"
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again
          </button>

          <Link
            className="button button--secondary"
            to="/services"
          >
            Browse services
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <Link className="back-link" to="/services">
        ← Browse services
      </Link>

      {USING_MOCK_SERVICES && (
        <p className="demo-notice">
          Demo listing: this is sample service information.
        </p>
      )}

      <div className="service-detail-layout">
        <article className="panel">
          <p className="eyebrow">{service.categoryName}</p>
          <h1>{service.title}</h1>

          <p className="service-provider">
            By{" "}
            <Link to={`/providers/${service.provider.id}`}>
              {service.provider.displayName}
            </Link>
          </p>

          {service.ratingSummary?.available && (
            <p
              className="review-score"
              aria-label={
                service.ratingSummary.ratingCount > 0
                  ? `${service.ratingSummary.averageRating} out of 5 from ${service.ratingSummary.ratingCount} reviews`
                  : "No reviews yet"
              }
            >
              {service.ratingSummary.ratingCount > 0
                ? `★ ${service.ratingSummary.averageRating} / 5 (${service.ratingSummary.ratingCount} review${service.ratingSummary.ratingCount === 1 ? "" : "s"})`
                : "No reviews yet"}
            </p>
          )}

          <h2>About this service</h2>
          <p>{service.description}</p>

          <dl className="profile-details">
            <div>
              <dt>Service area</dt>
              <dd>{service.location}</dd>
            </div>

            <div>
              <dt>Availability</dt>
              <dd>{service.availabilitySummary}</dd>
            </div>
          </dl>
        </article>

        <aside
          className="panel service-price-panel"
          aria-label="Service pricing"
        >
          <h2>Service price</h2>

          <p className="service-detail-price">
            {formatPrice(service.price, service.currency)}
          </p>

          <p>Per {service.pricingUnit}</p>

          {isCheckingSession ? (
            <p role="status">Checking your session...</p>
          ) : !user || user.role === "customer" ? (
            <>
              <Link
                className="button"
                to={`/services/${service.id}/book`}
              >
                {user ? "Book this service" : "Log in to book"}
              </Link>

              <p className="form-note">
                Submit a booking request for provider confirmation.
              </p>
            </>
          ) : (
            <p className="form-note">
              Booking is available to customer accounts.
            </p>
          )}
        </aside>
      </div>
      <section className="panel">
        <h2>Customer reviews</h2>

        {reviews.length === 0 ? (
          <p className="form-note">
            This service has no published reviews yet.
          </p>
        ) : (
          <div className="review-list">
            {reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <p className="review-score">
                  {review.rating} out of 5
                </p>

                <p>
                  {review.customer?.fullName || "Verified customer"}
                </p>

                <p className="review-comment">
                  {review.comment || "No written comment provided."}
                </p>

                <p className="form-note">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}