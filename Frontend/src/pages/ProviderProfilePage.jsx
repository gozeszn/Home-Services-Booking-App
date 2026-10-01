import React, { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import {
  getMyProviderProfile,
  saveMyProviderProfile,
} from "../services/providerService";
import { getErrorMessage } from "../services/api";

function createEmptyProfile(user) {
  return {
    displayName: user.fullName || "",
    description: "",
    serviceArea: user.location || "",
    phone: user.phone || "",
    availabilitySummary: "",
  };
}

function toForm(profile) {
  return {
    displayName: profile.displayName,
    description: profile.description,
    serviceArea: profile.serviceArea,
    phone: profile.phone,
    availabilitySummary: profile.availabilitySummary,
  };
}

export default function ProviderProfilePage() {
  const { user, token } = useAuth();

  const [form, setForm] = useState(() =>
    createEmptyProfile(user)
  );

  const [savedForm, setSavedForm] = useState(null);
  const [hasSavedProfile, setHasSavedProfile] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadProfile() {
      setIsLoading(true);
      setLoadError("");
      setError("");
      setSuccess("");

      try {
        const profile = await getMyProviderProfile(token, {
          signal: controller.signal,
        });

        if (!active) return;

        const initialForm = profile
          ? toForm(profile)
          : createEmptyProfile(user);

        setForm(initialForm);
        setSavedForm(initialForm);
        setHasSavedProfile(Boolean(profile));
      } catch (error) {
        if (!active || error.name === "AbortError") return;

        setLoadError(
          error.status === 401
            ? "Your session is no longer valid. Sign out and sign in again."
            : getErrorMessage(error)
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    token,
    user.id,
    user.fullName,
    user.phone,
    user.location,
    retry,
  ]);

  const hasChanges =
    savedForm !== null &&
    Object.keys(form).some(
      (field) => form[field] !== savedForm[field]
    );

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
    if (!savedForm) return;

    setForm({ ...savedForm });
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSaving) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const profile = await saveMyProviderProfile(token, form);
      const updatedForm = toForm(profile);

      setForm(updatedForm);
      setSavedForm(updatedForm);
      setHasSavedProfile(true);
      setSuccess("Your provider profile has been saved.");
    } catch (error) {
      setError(
        error.status === 401
          ? "Your session is no longer valid. Sign out and sign in again."
          : getErrorMessage(error)
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="panel" role="status">
        Loading provider profile...
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="panel">
        <h1>Provider profile</h1>
        <p className="form-error" role="alert">
          {loadError}
        </p>

        <button
          className="button"
          type="button"
          onClick={() => setRetry((value) => value + 1)}
        >
          Try again
        </button>
      </section>
    );
  }

  return (
    <section aria-labelledby="provider-profile-title">
      <div className="page-heading">
        <p className="eyebrow">Provider workspace</p>
        <h1 id="provider-profile-title">
          Your provider profile
        </h1>

        <p className="intro">
          Tell customers about your business and where you work.
        </p>
      </div>

      <p className="form-note">
        This profile is saved to the application database. Your business
        description, service area, availability, and business phone number
        are available through your public provider profile. Use sample
        information while testing.
      </p>

      <div className="provider-profile-layout">
        <section className="panel provider-editor">
          <h2>
            {hasSavedProfile
              ? "Edit business details"
              : "Set up your business profile"}
          </h2>

          <p className="form-note">
            Your account name and contact details are used as
            initial suggestions. Changes here do not update
            My account.
          </p>

          {error && (
            <p className="form-error" role="alert">
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
          >
            <fieldset
              className="profile-fields"
              disabled={isSaving}
            >
              <legend className="sr-only">
                Business profile details
              </legend>

              <div className="form-field">
                <label htmlFor="provider-name">
                  Business or display name
                </label>

                <input
                  id="provider-name"
                  name="displayName"
                  autoComplete="organization"
                  minLength={2}
                  maxLength={100}
                  value={form.displayName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="provider-description">
                  About your business
                </label>

                <textarea
                  id="provider-description"
                  name="description"
                  rows={6}
                  minLength={20}
                  maxLength={1500}
                  value={form.description}
                  onChange={handleChange}
                  aria-describedby="provider-description-hint"
                  required
                />

                <small id="provider-description-hint">
                  Describe your services and experience.
                  {" "}
                  {form.description.length}/1,500 characters.
                </small>
              </div>

              <div className="form-field">
                <label htmlFor="provider-area">
                  Service area
                </label>

                <input
                  id="provider-area"
                  name="serviceArea"
                  placeholder="For example: Ikeja and nearby areas"
                  minLength={2}
                  maxLength={200}
                  value={form.serviceArea}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="provider-phone">
                  Business phone number
                </label>

                <input
                  id="provider-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  minLength={7}
                  maxLength={30}
                  value={form.phone}
                  onChange={handleChange}
                  aria-describedby="provider-phone-hint"
                  required
                />

                <small id="provider-phone-hint">
                  This is intended for your public profile.
                  Use a sample number while testing.
                </small>
              </div>

              <div className="form-field">
                <label htmlFor="provider-availability">
                  Availability
                </label>

                <textarea
                  id="provider-availability"
                  name="availabilitySummary"
                  rows={3}
                  placeholder="For example: Monday to Saturday, 9am to 5pm"
                  minLength={5}
                  maxLength={300}
                  value={form.availabilitySummary}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-actions">
                <button
                  className="button"
                  type="submit"
                  disabled={
                    isSaving || (hasSavedProfile && !hasChanges)
                  }
                >
                  {isSaving
                    ? "Saving..."
                    : "Save profile"}
                </button>

                <button
                  className="button button--secondary"
                  type="button"
                  onClick={handleReset}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel changes
                </button>
              </div>
            </fieldset>
          </form>
        </section>

        <aside
          className="panel provider-preview"
          aria-labelledby="provider-preview-title"
        >
          <p className="eyebrow">Live preview</p>

          <h2 id="provider-preview-title">
            {form.displayName.trim() || "Your business name"}
          </h2>

          <p className="form-note">
            This preview includes unsaved changes.
          </p>

          <p className="provider-description">
            {form.description.trim() ||
              "Your business description will appear here."}
          </p>

          <dl className="profile-details">
            <div>
              <dt>Service area</dt>
              <dd>{form.serviceArea.trim() || "Not provided"}</dd>
            </div>

            <div>
              <dt>Business phone</dt>
              <dd>{form.phone.trim() || "Not provided"}</dd>
            </div>

            <div>
              <dt>Availability</dt>
              <dd>
                {form.availabilitySummary.trim() ||
                  "Not provided"}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}