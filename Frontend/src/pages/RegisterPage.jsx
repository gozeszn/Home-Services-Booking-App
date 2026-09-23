import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

export default function RegisterPage() {
  const { register, isAuthenticated, isLoading } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <section className="panel" role="status">
        Checking your session...
      </section>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/profile" replace />;
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

    if (form.fullName.trim().length < 2) {
      setError("Enter a name with at least two characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (new TextEncoder().encode(form.password).length > 72) {
      setError("Your password is too long. Use at most 72 UTF-8 bytes.");
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
      });
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel auth-panel">
      <p className="eyebrow">Get started</p>
      <h1>Create an account</h1>
      <p>Join as a customer or a service provider.</p>

      {error && (
        <p className="form-error" role="alert" id="register-error">
          {error}
        </p>
      )}

      <form
        className="auth-form"
        onSubmit={handleSubmit}
        aria-describedby={error ? "register-error" : undefined}
      >
        <div className="form-field">
          <label htmlFor="register-name">Full name</label>
          <input
            id="register-name"
            name="fullName"
            autoComplete="name"
            minLength={2}
            maxLength={100}
            value={form.fullName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
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
          <label htmlFor="register-role">Account type</label>
          <select
            id="register-role"
            name="role"
            value={form.role}
            onChange={handleChange}
          >
            <option value="customer">Customer — book services</option>
            <option value="provider">Provider — offer services</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={handleChange}
            aria-describedby="password-hint"
            required
          />
          <small id="password-hint">
            Use at least eight characters.
          </small>
        </div>

        <div className="form-field">
          <label htmlFor="register-confirm-password">
            Confirm password
          </label>
          <input
            id="register-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        <button
          className="button"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}