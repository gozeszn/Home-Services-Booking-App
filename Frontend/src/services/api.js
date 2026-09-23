const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api/v1"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status, code, details = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest(
  path,
  { method = "GET", body, token, signal } = {}
) {
  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      "Unable to reach the server. Check your connection and try again.",
      0,
      "NETWORK_ERROR"
    );
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message || "The request failed.",
      response.status,
      payload?.error?.code || "REQUEST_FAILED",
      payload?.error?.details || []
    );
  }

  if (!payload || payload.success !== true) {
    throw new ApiError(
      "The server returned an unexpected response.",
      response.status,
      "INVALID_RESPONSE"
    );
  }

  return payload.data;
}

export function getErrorMessage(error) {
  if (error instanceof ApiError) {
    const messages = error.details
      .map((detail) => detail.message)
      .filter(Boolean);

    if (messages.length > 0) {
      return [...new Set(messages)].join(" ");
    }

    return error.message;
  }

  return "Something went wrong. Please try again.";
}