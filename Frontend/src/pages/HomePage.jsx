import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ServiceCard from "../components/ServiceCard";
import {
  getCategories,
  getServices,
  USING_MOCK_SERVICES,
} from "../services/serviceService";

const STEPS = [
  {
    title: "Find a service",
    description:
      "Browse categories or search for the help you need in your area.",
  },
  {
    title: "Send a booking request",
    description:
      "Review the service details, choose a time, and provide your address.",
  },
  {
    title: "Follow your booking",
    description:
      "Check its status in your account and leave a review after completion.",
  },
];

const CATEGORY_DESCRIPTIONS = {
  cleaning: "Everyday cleaning and a fresh start for your space.",
  plumbing: "Help with taps, pipes, and bathroom maintenance.",
  electrical: "Find help with electrical inspections and faults.",
  gardening: "Care for your garden and outdoor spaces.",
};

export default function HomePage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    setIsLoading(true);
    setError("");

    Promise.all([
      getCategories(),
      getServices({ limit: 4, sort: "title" }),
    ])
      .then(([categoryRecords, result]) => {
        if (!active) return;

        setCategories(categoryRecords);
        setServices(result.services);
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Could not load the service catalogue.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retry]);

  function handleSearch(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") || "").trim();
    const location = String(formData.get("location") || "").trim();

    const params = new URLSearchParams();

    if (query) params.set("q", query);
    if (location) params.set("location", location);

    navigate(`/services${params.size ? `?${params.toString()}` : ""}`);
  }

  const workspaceLink =
    user?.role === "customer"
      ? { to: "/bookings", label: "My bookings" }
      : user?.role === "provider"
        ? { to: "/provider/services", label: "Manage my services" }
        : { to: "/dashboard", label: "Open dashboard" };

  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__copy">
          <p className="eyebrow">Less on your list. More time for you.</p>

          <h1 id="home-title">A helping hand for your home.</h1>

          <p className="intro">
            From a cleaner kitchen to a tidier garden, find home services
            in your area and keep your bookings in one place.
          </p>

          <div className="home-actions">
            <Link className="button" to="/services">
              Explore services
            </Link>

            {!authLoading &&
              (user ? (
                <Link
                  className="button button--secondary"
                  to={workspaceLink.to}
                >
                  {workspaceLink.label}
                </Link>
              ) : (
                <Link className="button button--secondary" to="/register">
                  Create an account
                </Link>
              ))}
          </div>
        </div>

        <aside className="home-hero__aside" aria-label="Getting started">
          <p className="eyebrow">Make room for what matters</p>
          <h2>What needs doing?</h2>
          <p>
            Start with a task and a location. You can review the provider,
            service description, and listed price before requesting a booking.
          </p>

          <ul className="home-checklist">
            <li>Browse by service category</li>
            <li>Compare listed prices</li>
            <li>Manage requests from your account</li>
          </ul>
        </aside>

        <form
          className="home-search"
          role="search"
          aria-label="Find home services"
          onSubmit={handleSearch}
        >
          <div className="form-field">
            <label htmlFor="home-query">What do you need?</label>
            <input
              id="home-query"
              name="q"
              type="search"
              placeholder="Try cleaning or plumbing"
              maxLength={100}
            />
          </div>

          <div className="form-field">
            <label htmlFor="home-location">Location</label>
            <input
              id="home-location"
              name="location"
              type="text"
              placeholder="For example, Lagos"
              maxLength={100}
            />
          </div>

          <button className="button" type="submit">
            Find services
          </button>
        </form>
      </section>

      

      {isLoading ? (
        <p className="home-load-state" role="status">
          Loading categories and services...
        </p>
      ) : error ? (
        <div className="panel home-load-state">
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
      ) : (
        <>
          <section
            className="home-section"
            aria-labelledby="home-categories-title"
          >
            <header className="home-section__heading">
              <div>
                <p className="eyebrow">Start with the essentials</p>
                <h2 id="home-categories-title">Help for every corner.</h2>
              </div>
              <Link to="/services">Browse all services →</Link>
            </header>

            {categories.length === 0 ? (
              <p>Categories are not available yet. Please check back soon.</p>
            ) : (
              <div className="home-category-grid">
                {categories.map((category, index) => (
                  <Link
                    className="home-category"
                    key={category.id}
                    to={`/services?${new URLSearchParams({
                      category: category.id,
                    }).toString()}`}
                  >
                    <span className="home-category__number" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3>{category.name}</h3>
                    <p>
                      {CATEGORY_DESCRIPTIONS[category.name.trim().toLowerCase()] ||
                        "Explore services available in this category."}
                    </p>
                    <span className="home-category__link">
                      Explore <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section
            className="home-section"
            aria-labelledby="home-services-title"
          >
            <header className="home-section__heading">
              <div>
                <p className="eyebrow">Explore the catalogue</p>
                <h2 id="home-services-title">
                  {USING_MOCK_SERVICES
                    ? "A look at our sample services."
                    : "Find your next helping hand."}
                </h2>
              </div>
              <Link to="/services">View all services →</Link>
            </header>

            {services.length === 0 ? (
              <p>No services are listed yet. Please check back soon.</p>
            ) : (
              <div className="service-grid">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <section
        className="home-section home-how"
        aria-labelledby="home-how-title"
      >
        <header className="home-section__heading">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 id="home-how-title">From to-do to taken care of.</h2>
          </div>
        </header>

        <ol className="home-steps">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="home-step-number" aria-hidden="true">
                {index + 1}
              </span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-provider" aria-labelledby="home-provider-title">
        <div>
          <p className="eyebrow">For service providers</p>
          <h2 id="home-provider-title">Put your skills to work.</h2>
          <p>
            Create a provider profile, describe the services you offer,
            and manage incoming booking requests from your workspace.
          </p>
        </div>

        {!authLoading &&
          (user ? (
            <Link
              className="button button--secondary"
              to={
                user.role === "provider"
                  ? "/provider/profile"
                  : "/dashboard"
              }
            >
              {user.role === "provider"
                ? "Open provider profile"
                : "Open my dashboard"}
            </Link>
          ) : (
            <div>
              <Link className="button button--secondary" to="/register">
                Create a provider account
              </Link>
              <p className="home-provider__hint">
                Choose “Provider” on the registration form.
              </p>
            </div>
          ))}
      </section>

      <section className="home-section" aria-labelledby="home-faq-title">
        <header className="home-section__heading">
          <div>
            <p className="eyebrow">Before you begin</p>
            <h2 id="home-faq-title">A few helpful answers.</h2>
          </div>
        </header>

        <div className="home-faq">
          <details>
            <summary>Do I need an account to browse?</summary>
            <p>
              No. You can explore services without signing in. A customer
              account is required to request a booking.
            </p>
          </details>

          <details>
            <summary>Is a booking request immediately confirmed?</summary>
            <p>
              No. A new request starts as pending. Check its status on
              your bookings page to see whether the provider has accepted it.
              In this preview, customer and provider demo records are separate.
            </p>
          </details>

          <details>
            <summary>Can I cancel a booking?</summary>
            <p>
              The current customer workflow allows cancellation of pending
              or accepted bookings. Open My bookings to see the available
              action for each request.
            </p>
          </details>

          <details>
            <summary>Can I make a real payment here?</summary>
            <p>
              Not yet. Payment processing is not connected in this project
              preview. Any sample payment statuses are demonstration data.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}