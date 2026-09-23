import React, { useState } from "react";

import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

function createForm(user) {
  return {
    fullName: user.fullName,
    phone: user.phone ?? "",
    location: user.location ?? "",
  };
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();

  const [form, setForm] = useState(() => createForm(user));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges =
    form.fullName !== user.fullName ||
    form.phone !== (user.phone ?? "") ||
    form.location !== (user.location ?? "");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  function handleReset() {
    setForm(createForm(user));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSaving || !hasChanges) {
      return;
    }

    setError("");
    setSuccess("");

    const values = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
    };

    if (values.fullName.length < 2) {
      setError("Enter a name with at least two characters.");
      return;
    }

    // Send only fields whose values have changed.
    const updates = {};

    for (const field of ["fullName", "phone", "location"]) {
      if (values[field] !== (user[field] ?? "")) {
        updates[field] = values[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      setForm(createForm(user));
      setSuccess("Your profile is already up to date.");
      return;
    }

    setIsSaving(true);

    try {
      const updatedUser = await updateProfile(updates);

      if (!updatedUser) {
        return;
      }

      setForm(createForm(updatedUser));
      setSuccess("Your profile has been updated.");
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="panel profile-panel">
      <p className="eyebrow">Your account</p>
      <h1>My profile</h1>
      <p>Keep your contact details up to date.</p>

      <dl className="profile-details account-summary">
        <div>
          <dt>Email address</dt>
          <dd>{user.email}</dd>
        </div>

        <div>
          <dt>Account type</dt>
          <dd>{user.role}</dd>
        </div>
      </dl>

      <p className="form-note">
        Your email address and account type cannot be changed here.
      </p>

      {error && (
        <p
          className="form-error"
          id="profile-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {success && (
        <p className="form-success" role="status">
          {success}
        </p>
      )}

      <form
        className="auth-form"
        onSubmit={handleSubmit}
        aria-busy={isSaving}
        aria-describedby={error ? "profile-error" : undefined}
      >
        <fieldset className="profile-fields" disabled={isSaving}>
          <legend className="sr-only">
            Editable profile details
          </legend>

          <div className="form-field">
            <label htmlFor="profile-name">Full name</label>
            <input
              id="profile-name"
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
            <label htmlFor="profile-phone">
              Phone number
            </label>
            <input
              id="profile-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={30}
              value={form.phone}
              onChange={handleChange}
              aria-describedby="phone-hint"
            />
            <small id="phone-hint">
              Optional. Include your country code.
            </small>
          </div>

          <div className="form-field">
            <label htmlFor="profile-location">
              Location
            </label>
            <input
              id="profile-location"
              name="location"
              autoComplete="address-level2"
              maxLength={200}
              value={form.location}
              onChange={handleChange}
              aria-describedby="location-hint"
            />
            <small id="location-hint">
              Optional. Enter your city or area.
            </small>
          </div>

          <div className="form-actions">
            <button
              className="button"
              type="submit"
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>

            <button
              className="button button--secondary"
              type="button"
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
            >
              Cancel changes
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}