import React, { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestedPath = location.state?.from;
  const destination =
    typeof requestedPath === "string" &&
    requestedPath.startsWith("/") &&
    !requestedPath.startsWith("//") &&
    !requestedPath.startsWith("/login") &&
    !requestedPath.startsWith("/register")
      ? requestedPath
      : "/profile";

  if (isLoading) {
    return (
      <section className="panel" role="status">
        Checking your session...
      </section>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      await login(form);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel auth-panel">
      <p className="eyebrow">Welcome back</p>
      <h1>Log in</h1>
      <p>Access your account and manage your home services.</p>

      {error && (
        <p className="form-error" role="alert" id="login-error">
          {error}
        </p>
      )}

      <form
        className="auth-form"
        onSubmit={handleSubmit}
        aria-describedby={error ? "login-error" : undefined}
      >
        <div className="form-field">
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            maxLength={254}
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <button
          className="button"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="auth-switch">
        Need an account? <Link to="/register">Register</Link>
      </p>
    </section>
  );
}