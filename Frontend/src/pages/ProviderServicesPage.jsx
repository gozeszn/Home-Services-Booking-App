import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";
import { getCategories } from "../services/serviceService";
import { formatPrice } from "../utils/formatPrice";
import {
  getMyServices,
  saveMyService,
  setMyServiceStatus,
} from "../services/providerServiceService";

const PAGE_SIZE = 4;

const EMPTY_FORM = {
  title: "",
  categoryId: "",
  description: "",
  price: "",
  pricingUnit: "visit",
  serviceArea: "",
  availabilitySummary: "",
};

function displayError(error) {
  if (error.status === 401) {
    return "Your session is no longer valid. Sign out and sign in again.";
  }

  return getErrorMessage(error);
}

export default function ProviderServicesPage() {
  const { token } = useAuth();

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: PAGE_SIZE,
    totalItems: 0,
    totalPages: 0,
  });

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [retry, setRetry] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const titleInput = useRef(null);
  const mutationLock = useRef(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadServices() {
      setIsLoading(true);
      setLoadFailed(false);
      setError("");

      try {
        const [categoryRecords, result] = await Promise.all([
          getCategories({ signal: controller.signal }),
          getMyServices(token, {
            status: filter,
            page,
            limit: PAGE_SIZE,
            signal: controller.signal,
          }),
        ]);

        if (!active) return;

        setCategories(categoryRecords);
        setServices(result.services);
        setMeta(result.meta);

        // The backend clamps a page if its final item has disappeared.
        if (result.meta.page !== page) {
          setPage(result.meta.page);
        }
      } catch (error) {
        if (!active || error.name === "AbortError") return;

        setLoadFailed(true);
        setError(displayError(error));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadServices();

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, filter, page, retry]);

  useEffect(() => {
    if (showEditor) {
      titleInput.current?.focus();
    }
  }, [showEditor]);

  function openCreateForm() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowEditor(true);
    setError("");
    setMessage("");
  }

  function openEditForm(service) {
    const categoryAvailable = categories.some(
      (category) => category.id === service.categoryId
    );

    setEditingId(service.id);
    setForm({
      title: service.title,
      categoryId: categoryAvailable ? service.categoryId : "",
      description: service.description,
      price: String(service.price),
      pricingUnit: service.pricingUnit,
      serviceArea: service.serviceArea,
      availabilitySummary: service.availabilitySummary,
    });

    setShowEditor(true);
    setError("");
    setMessage("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  function reloadListings() {
    setIsLoading(true);
    setRetry((value) => value + 1);
  }

  async function handleSave(event) {
    event.preventDefault();

    if (mutationLock.current) return;

    if (!categories.some((category) => category.id === form.categoryId)) {
      setError("Choose an available category.");
      return;
    }

    mutationLock.current = true;
    setIsBusy(true);
    setError("");
    setMessage("");

    try {
      const wasEditing = editingId !== null;

      await saveMyService(token, form, editingId);

      setShowEditor(false);
      setEditingId(null);
      setFilter("");
      setPage(1);

      setMessage(
        wasEditing
          ? "Your service has been updated."
          : "Service created as inactive. Activate it when you are ready."
      );

      // Reload from the backend instead of guessing pagination totals.
      reloadListings();
    } catch (error) {
      setError(displayError(error));
    } finally {
      mutationLock.current = false;
      setIsBusy(false);
    }
  }

  async function toggleStatus(service) {
    if (mutationLock.current) return;

    const nextStatus =
      service.status === "active" ? "inactive" : "active";

    mutationLock.current = true;
    setIsBusy(true);
    setError("");
    setMessage("");

    try {
      const updated = await setMyServiceStatus(
        token,
        service.id,
        nextStatus
      );

      setMessage(`"${updated.title}" is now ${updated.status}.`);
      reloadListings();
    } catch (error) {
      setError(displayError(error));
    } finally {
      mutationLock.current = false;
      setIsBusy(false);
    }
  }

  return (
    <section aria-labelledby="my-services-title">
      <header className="page-heading">
        <p className="eyebrow">Provider workspace</p>
        <h1 id="my-services-title">My services</h1>
        <p className="intro">
          Create listings and manage the services you offer.
        </p>
      </header>

      <p className="form-note">
        These listings are stored in the application database.
        Complete your{" "}
        <Link to="/provider/profile">provider profile</Link>{" "}
        before creating your first service. New listings start inactive.
      </p>

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

      {isLoading ? (
        <p className="panel" role="status">
          Loading services...
        </p>
      ) : loadFailed ? (
        <button
          className="button"
          type="button"
          onClick={reloadListings}
        >
          Reload services
        </button>
      ) : showEditor ? (
        <section className="panel service-editor">
          <h2>{editingId ? "Edit service" : "Create service"}</h2>

          <p className="form-note">
            Choose an active category. If a previous category is no longer
            available, select another before saving.
          </p>

          <form
            className="auth-form"
            onSubmit={handleSave}
            aria-busy={isBusy}
          >
            <fieldset className="profile-fields" disabled={isBusy}>
              <legend className="sr-only">Service information</legend>

              <div className="form-field">
                <label htmlFor="managed-service-title">Service title</label>
                <input
                  ref={titleInput}
                  id="managed-service-title"
                  name="title"
                  minLength={3}
                  maxLength={100}
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="managed-service-category">Category</label>
                <select
                  id="managed-service-category"
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="managed-service-description">
                  Description
                </label>
                <textarea
                  id="managed-service-description"
                  name="description"
                  rows={5}
                  minLength={20}
                  maxLength={1500}
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="service-form-row">
                <div className="form-field">
                  <label htmlFor="managed-service-price">
                    Price in naira
                  </label>
                  <input
                    id="managed-service-price"
                    name="price"
                    type="number"
                    min="0"
                    max="1000000000"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="managed-service-unit">Pricing unit</label>
                  <select
                    id="managed-service-unit"
                    name="pricingUnit"
                    value={form.pricingUnit}
                    onChange={handleChange}
                    required
                  >
                    <option value="visit">Per visit</option>
                    <option value="hour">Per hour</option>
                    <option value="job">Per job</option>
                    <option value="day">Per day</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="managed-service-area">Service area</label>
                <input
                  id="managed-service-area"
                  name="serviceArea"
                  minLength={2}
                  maxLength={200}
                  value={form.serviceArea}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="managed-service-availability">
                  Availability
                </label>
                <textarea
                  id="managed-service-availability"
                  name="availabilitySummary"
                  rows={3}
                  minLength={5}
                  maxLength={300}
                  value={form.availabilitySummary}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-actions">
                <button className="button" type="submit">
                  {isBusy ? "Saving..." : "Save service"}
                </button>

                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => {
                    setShowEditor(false);
                    setEditingId(null);
                    setError("");
                  }}
                >
                  Discard changes
                </button>
              </div>
            </fieldset>
          </form>
        </section>
      ) : (
        <>
          {categories.length === 0 && (
            <p className="demo-notice">
              No active categories are available. Seed the development
              categories before creating a service.
            </p>
          )}

          <div className="services-toolbar">
            <button
              className="button"
              type="button"
              disabled={isBusy || categories.length === 0}
              onClick={openCreateForm}
            >
              Create service
            </button>

            <div className="form-field">
              <label htmlFor="managed-service-status">Filter by status</label>
              <select
                id="managed-service-status"
                value={filter}
                disabled={isBusy}
                onChange={(event) => {
                  setFilter(event.target.value);
                  setPage(1);
                  setMessage("");
                  setError("");
                }}
              >
                <option value="">All services</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <p role="status">
            {meta.totalItems} matching service
            {meta.totalItems === 1 ? "" : "s"}
          </p>

          {services.length === 0 ? (
            <div className="panel">
              <h2>{filter ? "No matching services" : "No services yet"}</h2>
              <p>
                {filter
                  ? "Try another status filter."
                  : "Create your first database listing to get started."}
              </p>
            </div>
          ) : (
            <div className="service-grid">
              {services.map((service) => (
                <article className="service-card" key={service.id}>
                  <div className="booking-card-header">
                    <h2>{service.title}</h2>
                    <span className="status-badge">{service.status}</span>
                  </div>

                  <p className="service-provider">
                    {service.categoryName}
                    {" · "}
                    {service.serviceArea}
                  </p>

                  <p className="service-description">
                    {service.description}
                  </p>

                  <p>
                    <strong>
                      {formatPrice(service.price, service.currency)}
                    </strong>
                    {" / "}
                    {service.pricingUnit}
                  </p>

                  <p className="form-note">
                    {service.availabilitySummary}
                  </p>

                  <div className="form-actions">
                    <button
                      className="button button--secondary"
                      type="button"
                      disabled={isBusy}
                      onClick={() => openEditForm(service)}
                      aria-label={`Edit ${service.title}`}
                    >
                      Edit
                    </button>

                    <button
                      className="button"
                      type="button"
                      disabled={isBusy}
                      onClick={() => toggleStatus(service)}
                      aria-label={`${
                        service.status === "active"
                          ? "Deactivate"
                          : "Activate"
                      } ${service.title}`}
                    >
                      {service.status === "active"
                        ? "Deactivate"
                        : "Activate"}
                    </button>

                    {service.status === "active" && (
                      <Link
                        className="button button--secondary"
                        to={`/services/${service.id}`}
                      >
                        View public listing
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {meta.totalPages > 1 && (
            <nav className="pagination" aria-label="My service pages">
              <button
                className="button button--secondary"
                type="button"
                disabled={isBusy || meta.page === 1}
                onClick={() => setPage(meta.page - 1)}
              >
                Previous
              </button>

              <span>
                Page {meta.page} of {meta.totalPages}
              </span>

              <button
                className="button button--secondary"
                type="button"
                disabled={isBusy || meta.page === meta.totalPages}
                onClick={() => setPage(meta.page + 1)}
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