import { apiRequest, ApiError } from "./api";

export const USING_MOCK_PROVIDERS = false;

function requireToken(token) {
  if (!token) {
    throw new ApiError(
      "Please sign in to manage your provider profile.",
      401,
      "AUTHENTICATION_REQUIRED"
    );
  }
}

function validateProfileResponse(profile) {
  const fields = [
    "displayName",
    "description",
    "serviceArea",
    "phone",
    "availabilitySummary",
  ];

  if (
    !profile ||
    typeof profile.id !== "string" ||
    typeof profile.userId !== "string" ||
    !fields.every((field) => typeof profile[field] === "string")
  ) {
    throw new ApiError(
      "The server returned invalid provider profile data.",
      502,
      "INVALID_RESPONSE"
    );
  }

  return profile;
}

export async function getMyProviderProfile(
  token,
  { signal } = {}
) {
  requireToken(token);

  const profile = await apiRequest("/providers/me", {
    token,
    signal,
  });

  // A provider who has not completed onboarding receives null.
  if (profile === null) {
    return null;
  }

  return validateProfileResponse(profile);
}

export async function saveMyProviderProfile(
  token,
  details,
  { signal } = {}
) {
  requireToken(token);

  // Send only the editable profile fields.
  // The backend determines ownership from the access token.
  const body = {
    displayName: details.displayName.trim(),
    description: details.description.trim(),
    serviceArea: details.serviceArea.trim(),
    phone: details.phone.trim(),
    availabilitySummary: details.availabilitySummary.trim(),
  };

  const profile = await apiRequest("/providers/me", {
    method: "PATCH",
    token,
    body,
    signal,
  });

  return validateProfileResponse(profile);
}

export async function getPublicProvider(
  providerId,
  { page = 1, limit = 4, signal } = {}
) {
  if (
    typeof providerId !== "string" ||
    !/^[0-9a-fA-F]{24}$/.test(providerId)
  ) {
    throw new ApiError(
      "This provider could not be found.",
      404,
      "PROVIDER_NOT_FOUND"
    );
  }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  const profile = await apiRequest(
    `/providers/${encodeURIComponent(providerId)}?${params.toString()}`,
    { signal }
  );

  const profileFields = [
    "displayName",
    "description",
    "phone",
    "serviceArea",
    "availabilitySummary",
  ];

  if (
    !profile ||
    typeof profile.id !== "string" ||
    !profileFields.every(
      (field) => typeof profile[field] === "string"
    ) ||
    !Array.isArray(profile.services) ||
    !profile.serviceMeta ||
    !Number.isInteger(profile.serviceMeta.page) ||
    !Number.isInteger(profile.serviceMeta.totalItems) ||
    !Number.isInteger(profile.serviceMeta.totalPages)
  ) {
    throw new ApiError(
      "The server returned invalid public provider data.",
      502,
      "INVALID_RESPONSE"
    );
  }

  return profile;
}