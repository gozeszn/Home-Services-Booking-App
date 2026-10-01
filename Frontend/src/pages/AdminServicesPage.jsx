import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { categories } from "../mocks/services";
import {
  getAdminServices,
  updateServiceModeration,
} from "../services/adminServiceService";

const PAGE_SIZE = 4;

function formatPrice(amount, currency) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function AdminServicesPage() {
  const { user: admin } = useAuth();

  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [selectedService, setSelectedService] = useState(null);
  const [reason, setReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    setIsLoading(true);
    setLoadFailed(false);
    setError("");
    setSelectedService(null);

    getAdminServices(admin)
      .then((records) => {
        if (active) setServices(records);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Could not load services.");
        setLoadFailed(true);
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
    setSelectedService(null);
    setActionError("");
  }

  function clearFilters() {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setPage(1);
    setSelectedService(null);
    setActionError("");
  }

  function selectService(service) {
    setSelectedService(service);
    setReason("");
    setActionError("");
    setMessage("");
  }

  async function handleModeration(event) {
    event.preventDefault();

    if (!selectedService || isUpdating) return;

    const status =
      selectedService.moderationStatus === "enabled" ? "disabled" : "enabled";

    setIsUpdating(true);
    setActionError("");
    setMessage("");

    try {
      const updated = await updateServiceModeration(
        admin,
        selectedService.id,
        {
          status,
          reason,
          expectedStatus: selectedService.moderationStatus,
        }
      );

      setServices((current) =>
        current.map((service) =>
          service.id === updated.id ? updated : service
        )
      );

      setMessage(`"${updated.title}" has been ${status} in the demo.`);
      setSelectedService(null);
      setReason("");
    } catch (err) {
      setActionError(err.message || "Could not update this service.");
    } finally {
      setIsUpdating(false);
    }
  }

  const query = search.trim().toLowerCase();

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      !query ||
      [service.title, service.providerName, service.location]
        .join(" ")
        .toLowerCase()
        .includes(query);

    const matchesCategory =
      !categoryFilter || service.categoryId === categoryFilter;

    const matchesStatus =
      !statusFilter || service.moderationStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredServices.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleServices = filteredServices.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <section>
      <header className="page-heading">
        <p className="eyebrow">Admin workspace</p>
        <h1>Service moderation</h1>
        <p className="intro">
          Review service listings and manage their moderation status.
        </p>
      </header>

      <div className="demo-notice">
        Demo mode: these are separate sample listings. Changes persist in
        this browser tab but do not affect real services, public search,
        provider availability, or existing bookings.
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="form-success" role="status">
          {message}
        </p>
      )}

      <fieldset
        className="admin-filters"
        disabled={isLoading || loadFailed || isUpdating}
      >
        <legend className="sr-only">Filter service listings</legend>

        <div className="form-field">
          <label htmlFor="admin-service-search">Search listings</label>
          <input
            id="admin-service-search"
            type="search"
            placeholder="Service, provider, or location"
            value={search}
            onChange={(event) =>
              changeFilter(setSearch, event.target.value)
            }
          />
        </div>

        <div className="form-field">
          <label htmlFor="admin-service-category">Category</label>
          <select
            id="admin-service-category"
            value={categoryFilter}
            onChange={(event) =>
              changeFilter(setCategoryFilter, event.target.value)
            }
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="admin-service-status">Moderation status</label>
          <select
            id="admin-service-status"
            value={statusFilter}
            onChange={(event) =>
              changeFilter(setStatusFilter, event.target.value)
            }
          >
            <option value="">All statuses</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
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
        <p role="status">Loading service listings...</p>
      ) : loadFailed ? (
        <button
          className="button button--secondary"
          type="button"
          onClick={() => setRetry((value) => value + 1)}
        >
          Try again
        </button>
      ) : filteredServices.length === 0 ? (
        <div className="panel">
          <h2>No matching services</h2>
          <p>Try another search or clear your filters.</p>
        </div>
      ) : (
        <>
          <p role="status">
            {filteredServices.length} matching service
            {filteredServices.length === 1 ? "" : "s"}
          </p>

          <div className="moderation-list">
            {visibleServices.map((service) => {
              const category = categories.find(
                (item) => item.id === service.categoryId
              );

              const isSelected = selectedService?.id === service.id;
              const isEnabled = service.moderationStatus === "enabled";

              return (
                <article className="panel moderation-card" key={service.id}>
                  <div className="moderation-card__header">
                    <div>
                      <p className="eyebrow">
                        {category?.name || "Uncategorized"}
                      </p>
                      <h2>{service.title}</h2>
                      <p>By {service.providerName}</p>
                    </div>

                    <span className="status-badge">
                      {isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>

                  <p>{service.description}</p>

                  <dl className="moderation-details">
                    <div>
                      <dt>Location</dt>
                      <dd>{service.location}</dd>
                    </div>
                    <div>
                      <dt>Price</dt>
                      <dd>
                        {formatPrice(service.price, service.currency)}
                        {" / "}
                        {service.pricingUnit}
                      </dd>
                    </div>
                  </dl>

                  {service.moderationReason && (
                    <p className="moderation-reason">
                      <strong>Latest moderation reason:</strong>{" "}
                      {service.moderationReason}
                    </p>
                  )}

                  {service.moderationHistory.length > 0 && (
                    <details className="moderation-history">
                      <summary>View demo moderation history</summary>

                      <ul>
                        {[...service.moderationHistory]
                          .reverse()
                          .map((entry, index) => (
                            <li key={`${entry.changedAt}-${index}`}>
                              <p>
                                {entry.from} → {entry.to}
                                {" · "}
                                {new Date(entry.changedAt).toLocaleString()}
                              </p>
                              <p>{entry.reason}</p>
                            </li>
                          ))}
                      </ul>
                    </details>
                  )}

                  {isSelected ? (
                    <form
                      className="moderation-form"
                      onSubmit={handleModeration}
                      aria-label={`Moderate ${service.title}`}
                      aria-busy={isUpdating}
                    >
                      <h3>
                        {isEnabled ? "Disable" : "Reactivate"} this listing?
                      </h3>

                      <p>
                        This changes only the demo moderation status.
                        It does not cancel bookings or change the provider’s
                        own availability setting.
                      </p>

                      <div className="form-field">
                        <label htmlFor={`reason-${service.id}`}>
                          Moderation reason
                        </label>
                        <textarea
                          id={`reason-${service.id}`}
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                          rows={3}
                          minLength={5}
                          maxLength={500}
                          required
                          autoFocus
                          disabled={isUpdating}
                          aria-describedby={`reason-help-${service.id}`}
                        />
                        <p
                          className="form-note"
                          id={`reason-help-${service.id}`}
                        >
                          Required: 5–500 characters. Use a sample reason,
                          not sensitive personal information.
                        </p>
                      </div>

                      {actionError && (
                        <p className="form-error" role="alert">
                          {actionError}
                        </p>
                      )}

                      <div className="form-actions">
                        <button
                          className={
                            isEnabled
                              ? "button button--danger"
                              : "button"
                          }
                          type="submit"
                          disabled={isUpdating}
                        >
                          {isUpdating
                            ? "Saving..."
                            : isEnabled
                              ? "Confirm disable"
                              : "Confirm reactivation"}
                        </button>

                        <button
                          className="button button--secondary"
                          type="button"
                          disabled={isUpdating}
                          onClick={() => {
                            setSelectedService(null);
                            setActionError("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      className="button button--secondary"
                      type="button"
                      disabled={isUpdating}
                      onClick={() => selectService(service)}
                    >
                      {isEnabled ? "Disable listing" : "Reactivate listing"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Service listing pages">
              <button
                className="button button--secondary"
                type="button"
                disabled={currentPage === 1 || isUpdating}
                onClick={() => {
                  setPage(currentPage - 1);
                  setSelectedService(null);
                }}
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="button button--secondary"
                type="button"
                disabled={currentPage === totalPages || isUpdating}
                onClick={() => {
                  setPage(currentPage + 1);
                  setSelectedService(null);
                }}
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