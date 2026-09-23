import React, { useEffect, useState } from "react";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1"
).replace(/\/+$/, "");

export default function HomePage() {
  const [connection, setConnection] = useState({
    status: "loading",
    message: "Checking the backend connection...",
  });

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const controller = new AbortController();
    let disposed = false;
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    async function checkConnection() {
      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Health request failed");

        const body = await response.json();
        if (!body.success || body.data?.status !== "ok") {
          throw new Error("Unexpected health response");
        }

        if (!disposed) {
          setConnection({
            status: "success",
            message: "Frontend connected to the backend successfully.",
          });
        }
      } catch (error) {
        if (disposed) return;
        setConnection({
          status: "error",
          message: error.name === "AbortError"
            ? "The connection check timed out. Check the backend and reload this page."
            : "Unable to connect. Check that the backend is running and the API URL and CORS origin are correct.",
        });
      } finally {
        window.clearTimeout(timeout);
      }
    }

    checkConnection();
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return (
    <section className="panel">
      <p className="eyebrow">Home Services</p>
      <h1>A helping hand for your home.</h1>
      <p className="intro">
        Find local service providers, arrange a booking, and manage
        your home services in one place.
      </p>
      {import.meta.env.DEV && (
        <div className={`connection connection--${connection.status}`} role="status">
          <strong>Development connection check</strong>
          <p>{connection.message}</p>
        </div>
      )}
    </section>
  );
}
