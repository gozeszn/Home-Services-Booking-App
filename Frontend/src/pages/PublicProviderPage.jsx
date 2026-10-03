import React, { useEffect, useState } from "react";
import {
  Link,
  useParams,
  useSearchParams,
} from "react-router-dom";

import ServiceCard from "../components/ServiceCard";
import { getPublicProvider } from "../services/providerService";
import { getErrorMessage } from "../services/api";

const PAGE_SIZE = 4;

export default function PublicProviderPage() {
  const { providerId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedPage = Number(searchParams.get("page") || 1);

  const page =
    Number.isInteger(requestedPage) &&
    requestedPage >= 1 &&
    requestedPage <= 100000
      ? requestedPage
      : 1;

  const [provider, setProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadProvider() {
      setIsLoading(true);
      setError("");
      setNotFound(false);
      setProvider(null);

      try {
        const data = await getPublicProvider(providerId, {
          page,
          limit: PAGE_SIZE,
          signal: controller.signal,
        });

        if (active) {
          setProvider(data);
        }
      } catch (error) {
        if (!active || error.name === "AbortError") return;

        setNotFound(error.status === 404);
        setError(
          error.status === 404
            ? "This provider profile is unavailable."
            : getErrorMessage(error)
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadProvider();

    return () => {
      active = false;
      controller.abort();
    };
  }, [providerId, page, retry]);

  function changePage(nextPage) {
    setSearchParams(
      nextPage === 1 ? {} : { page: String(nextPage) }
    );
  }

  if (isLoading) {
    return (
      <section className="panel" role="status">
        Loading provider profile...
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">
        <h1>
          {notFound ? "Provider unavailable" : "Unable to load provider"}
        </h1>

        <p className="form-error" role="alert">
          {error}
        </p>

        <div className="form-actions">
          {!notFound && (
            <button
              className="button"
              type="button"
              onClick={() => setRetry((value) => value + 1)}
            >
              Try again
            </button>
          )}

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

  if (!provider) return null;

  const { services, serviceMeta } = provider;

  return (
    <section aria-labelledby="public-provider-title">
      <Link className="back-link" to="/services">
        ← Browse services
      </Link>

      <header className="page-heading">
        <p className="eyebrow">Service provider</p>
        <h1 id="public-provider-title">
          {provider.displayName}
        </h1>
        <p className="intro">
          Learn about this business and explore its active services.
        </p>
      </header>

      <div className="service-detail-layout">
        <article className="panel">
          <h2>About this business</h2>

          <p className="provider-description">
            {provider.description || "No description provided."}
          </p>

          {provider.ratingSummary?.available && (
            <p
              className="review-score"
              aria-label={
                provider.ratingSummary.ratingCount > 0
                  ? `${provider.ratingSummary.averageRating} out of 5 from ${provider.ratingSummary.ratingCount} reviews`
                  : "No reviews yet"
              }
            >
              {provider.ratingSummary.ratingCount > 0
                ? `★ ${provider.ratingSummary.averageRating} / 5 (${provider.ratingSummary.ratingCount} review${provider.ratingSummary.ratingCount === 1 ? "" : "s"})`
                : "No reviews yet"}
            </p>
          )}
        </article>

        <aside
          className="panel service-price-panel"
          aria-label="Provider business details"
        >
          <h2>Business details</h2>

          <dl className="profile-details">
            <div>
              <dt>Service area</dt>
              <dd>{provider.serviceArea}</dd>
            </div>

            <div>
              <dt>Business phone</dt>
              <dd>{provider.phone}</dd>
            </div>

            <div>
              <dt>Availability</dt>
              <dd>
                {provider.availabilitySummary || "Not specified."}
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      <section
        className="home-section"
        aria-labelledby="provider-services-title"
      >
        <header className="page-heading">
          <h2 id="provider-services-title">Services from this provider</h2>

          <p role="status">
            {serviceMeta.totalItems} active service
            {serviceMeta.totalItems === 1 ? "" : "s"}
          </p>
        </header>

        {services.length === 0 ? (
          <div className="panel">
            <h3>No active services listed</h3>
            <p>
              This provider has not published any currently available
              services.
            </p>
            <Link to="/services">Explore other services</Link>
          </div>
        ) : (
          <div className="service-grid">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
              />
            ))}
          </div>
        )}

        {serviceMeta.totalPages > 1 && (
          <nav
            className="pagination"
            aria-label="Provider service pages"
          >
            <button
              className="button button--secondary"
              type="button"
              disabled={serviceMeta.page === 1}
              onClick={() => changePage(serviceMeta.page - 1)}
            >
              Previous
            </button>

            <span>
              Page {serviceMeta.page} of {serviceMeta.totalPages}
            </span>

            <button
              className="button button--secondary"
              type="button"
              disabled={
                serviceMeta.page === serviceMeta.totalPages
              }
              onClick={() => changePage(serviceMeta.page + 1)}
            >
              Next
            </button>
          </nav>
        )}
      </section>
    </section>
  );
}