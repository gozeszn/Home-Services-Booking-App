import { apiRequest, ApiError } from "./api";

export const USING_MOCK_SERVICES = false;

function invalidResponse(message) {
  return new ApiError(
    message,
    502,
    "INVALID_RESPONSE"
  );
}

export async function getCategories({ signal } = {}) {
  const categories = await apiRequest("/categories", { signal });

  if (
    !Array.isArray(categories) ||
    !categories.every(
      (category) =>
        category &&
        typeof category.id === "string" &&
        typeof category.name === "string"
    )
  ) {
    throw invalidResponse("The server returned invalid category data.");
  }

  return categories;
}

export async function getServices({
  q = "",
  category = "",
  location = "",
  sort = "title",
  page = 1,
  limit = 4,
  signal,
} = {}) {
  const params = new URLSearchParams();

  // Omit empty filters. An empty category is not a valid database ID.
  const filters = {
    q: q.trim(),
    category: category.trim(),
    location: location.trim(),
  };

  for (const [name, value] of Object.entries(filters)) {
    if (value) {
      params.set(name, value);
    }
  }

  params.set("sort", sort);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const result = await apiRequest(
    `/services?${params.toString()}`,
    { signal }
  );

  if (
    !result ||
    !Array.isArray(result.services) ||
    !result.meta ||
    !Number.isInteger(result.meta.page) ||
    !Number.isInteger(result.meta.limit) ||
    !Number.isInteger(result.meta.totalItems) ||
    !Number.isInteger(result.meta.totalPages)
  ) {
    throw invalidResponse("The server returned invalid service results.");
  }

  return result;
}

export async function getService(serviceId, { signal } = {}) {
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

  const service = await apiRequest(
    `/services/${encodeURIComponent(serviceId)}`,
    { signal }
  );

  if (
    !service ||
    typeof service.id !== "string" ||
    typeof service.title !== "string" ||
    !service.provider ||
    typeof service.provider.displayName !== "string"
  ) {
    throw invalidResponse("The server returned invalid service details.");
  }

  return service;
}