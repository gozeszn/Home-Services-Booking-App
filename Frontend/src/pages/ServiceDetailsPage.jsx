import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getService,
  USING_MOCK_SERVICES,
} from "../services/serviceService";
import { formatPrice } from "../utils/formatPrice";
import { useAuth } from "../context/AuthContext";

export default function ServiceDetailsPage() {
  const { serviceId } = useParams();
  const { user, isLoading: isCheckingSession } = useAuth();

  const [service, setService] = useState(null);
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
        const data = await getService(serviceId);

        if (active) {
          setService(data);
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
                Demo booking only. No provider will be contacted.
              </p>
            </>
          ) : (
            <p className="form-note">
              Booking is available to customer accounts.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}