import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../services/api";

import ServiceCard from "../components/ServiceCard";
import {
  getCategories,
  getServices,
  USING_MOCK_SERVICES,
} from "../services/serviceService";

export default function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const location = searchParams.get("location") || "";
  const requestedSort = searchParams.get("sort") || "title";

  const sort = ["title", "price-asc", "price-desc"].includes(
    requestedSort
  )
    ? requestedSort
    : "title";

  const page = Math.max(
    1,
    Math.floor(Number(searchParams.get("page"))) || 1
  );

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [results, setResults] = useState({
    services: [],
    meta: {
      page: 1,
      totalItems: 0,
      totalPages: 0,
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadServices() {
      setIsLoading(true);
      setError("");

      try {
        const [categories, data] = await Promise.all([
          getCategories(),
          getServices({
            q,
            category,
            location,
            sort,
            page,
            limit: 4,
          }),
        ]);

        if (active) {
          setCategoryOptions(categories);
          setResults(data);
        }
      } catch (error){
        if (active) {
          setError(getErrorMessage(error));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadServices();

    return () => {
      active = false;
    };
  }, [q, category, location, sort, page, retry]);

  function applyFilters(event) {
    event.preventDefault();

    const values = new FormData(event.currentTarget);
    const next = new URLSearchParams();

    for (const field of ["q", "category", "location", "sort"]) {
      const value = String(values.get(field) || "").trim();

      if (value) {
        next.set(field, value);
      }
    }

    // Omitting page starts a new search at page one.
    setSearchParams(next);
  }

  function changePage(nextPage) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  }

  return (
    <section aria-labelledby="services-title">
      <div className="page-heading">
        <p className="eyebrow">Explore</p>
        <h1 id="services-title">Find a service</h1>
        <p className="intro">
          Search for the help you need around your home.
        </p>
      </div>

      {USING_MOCK_SERVICES && (
        <p className="demo-notice">
          Demo listings: these services and prices are sample data.
          Booking is not available yet.
        </p>
      )}

      <form
        key={`${q}|${category}|${location}|${sort}`}
        className="service-filters"
        onSubmit={applyFilters}
        aria-label="Filter services"
      >
        <div className="form-field">
          <label htmlFor="service-search">Search</label>
          <input
            id="service-search"
            name="q"
            type="search"
            placeholder="Cleaning, plumbing..."
            maxLength={100}
            defaultValue={q}
          />
        </div>

        <div className="form-field">
          <label htmlFor="service-category">Category</label>
          <select
            id="service-category"
            name="category"
            defaultValue={category}
          >
            <option value="">All categories</option>

            {category &&
              !categoryOptions.some((item) => item.id === category) && (
                <option value={category}>{category}</option>
              )}

            {categoryOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="service-location">Location</label>
          <input
            id="service-location"
            name="location"
            placeholder="City or area"
            maxLength={200}
            defaultValue={location}
          />
        </div>

        <div className="form-field">
          <label htmlFor="service-sort">Sort by</label>
          <select
            id="service-sort"
            name="sort"
            defaultValue={sort}
          >
            <option value="title">Name</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>

        <div className="filter-actions">
          <button className="button" type="submit">
            Search
          </button>

          <button
            className="button button--secondary"
            type="button"
            onClick={() => {
              // Clear drafts even when the URL has no filters.
              document.getElementById("service-search").value = "";
              document.getElementById("service-category").value = "";
              document.getElementById("service-location").value = "";
              document.getElementById("service-sort").value = "title";
              setSearchParams({});
            }}
          >
            Clear
          </button>
        </div>
      </form>

      {isLoading ? (
        <p className="panel" role="status">
          Loading services...
        </p>
      ) : error ? (
        <div className="panel">
          <p className="form-error" role="alert">{error}</p>
          <button
            className="button"
            type="button"
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : results.services.length === 0 ? (
        <div className="panel" role="status">
          <h2>No services found</h2>
          <p>Try another search, category, or location.</p>
        </div>
      ) : (
        <>
          <p role="status">
            {results.meta.totalItems} service
            {results.meta.totalItems === 1 ? "" : "s"} found
          </p>

          <div className="service-grid">
            {results.services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
              />
            ))}
          </div>

          {results.meta.totalPages > 1 && (
            <nav
              className="pagination"
              aria-label="Service result pages"
            >
              <button
                className="button button--secondary"
                type="button"
                disabled={results.meta.page === 1}
                onClick={() =>
                  changePage(results.meta.page - 1)
                }
              >
                Previous
              </button>

              <span>
                Page {results.meta.page} of {results.meta.totalPages}
              </span>

              <button
                className="button button--secondary"
                type="button"
                disabled={
                  results.meta.page === results.meta.totalPages
                }
                onClick={() =>
                  changePage(results.meta.page + 1)
                }
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