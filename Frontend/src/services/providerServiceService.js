import { apiRequest, ApiError } from "./api";

function requireToken(token) {
  if (!token) {
    throw new ApiError(
      "Please sign in to manage your services.",
      401,
      "AUTHENTICATION_REQUIRED"
    );
  }
}

function requireServiceId(serviceId) {
  if (
    typeof serviceId !== "string" ||
    !/^[0-9a-fA-F]{24}$/.test(serviceId)
  ) {
    throw new ApiError(
      "This service could not be found.",
      404,
      "SERVICE_NOT_FOUND"
    );
  }
}

export async function getMyServices(
  token,
  { status = "", page = 1, limit = 4, signal } = {}
) {
  requireToken(token);

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (status) {
    params.set("status", status);
  }

  const result = await apiRequest(
    `/providers/me/services?${params.toString()}`,
    { token, signal }
  );

  if (
    !result ||
    !Array.isArray(result.services) ||
    !result.meta ||
    !Number.isInteger(result.meta.page) ||
    !Number.isInteger(result.meta.totalItems) ||
    !Number.isInteger(result.meta.totalPages)
  ) {
    throw new ApiError(
      "The server returned invalid service results.",
      502,
      "INVALID_RESPONSE"
    );
  }

  return result;
}

export async function saveMyService(
  token,
  details,
  serviceId = null
) {
  requireToken(token);

  if (serviceId !== null) {
    requireServiceId(serviceId);
  }

  const price = Number(details.price);

  if (
    String(details.price).trim() === "" ||
    !Number.isFinite(price) ||
    price < 0 ||
    price > 1_000_000_000 ||
    price !== Number(price.toFixed(2))
  ) {
    throw new ApiError(
      "Enter a price from 0 to 1,000,000,000 naira with at most two decimal places.",
      400,
      "VALIDATION_ERROR"
    );
  }

  const body = {
    title: details.title.trim(),
    categoryId: details.categoryId,
    description: details.description.trim(),
    price,
    currency: "NGN",
    pricingUnit: details.pricingUnit,
    serviceArea: details.serviceArea.trim(),
    availabilitySummary: details.availabilitySummary.trim(),
  };

  return apiRequest(
    serviceId ? `/services/${serviceId}` : "/services",
    {
      method: serviceId ? "PATCH" : "POST",
      token,
      body,
    }
  );
}

export async function setMyServiceStatus(
  token,
  serviceId,
  status
) {
  requireToken(token);
  requireServiceId(serviceId);

  if (!["active", "inactive"].includes(status)) {
    throw new ApiError(
      "Choose active or inactive.",
      400,
      "VALIDATION_ERROR"
    );
  }

  return apiRequest(`/services/${serviceId}/status`, {
    method: "PATCH",
    token,
    body: { status },
  });
}