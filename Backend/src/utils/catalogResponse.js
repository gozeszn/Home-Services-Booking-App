const { normalizePricingUnit } = require("./catalogRules");

// Member Four will supply derived values when the review module is available.
function unavailableRatingSummary() {
  return { available: false, averageRating: null, ratingCount: null };
}

function toProviderResponse(profile, { own = false } = {}) {
  if (!profile) return null;
  return {
    id: String(profile._id),
    ...(own ? { userId: String(profile.user._id || profile.user) } : {}),
    displayName: profile.displayName,
    description: profile.description || "",
    phone: profile.phone,
    serviceArea: profile.serviceArea,
    availabilitySummary: profile.availabilitySummary || "",
    ratingSummary: unavailableRatingSummary(),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function toServiceResponse(service) {
  const provider = service.provider;
  const category = service.categoryId;
  return {
    id: String(service._id),
    providerId: provider ? String(provider._id || provider) : null,
    provider: provider?.displayName
      ? { id: String(provider._id), displayName: provider.displayName }
      : null,
    title: service.title,
    description: service.description,
    categoryId: category ? String(category._id || category) : null,
    categoryName: category?.name || "Unavailable category",
    serviceArea: service.serviceArea,
    location: service.serviceArea,
    price: service.price,
    currency: service.currency || "NGN",
    pricingUnit: normalizePricingUnit(service.pricingUnit),
    availabilitySummary: service.availabilitySummary,
    status: service.status,
    ratingSummary: unavailableRatingSummary(),
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

function collectionMeta(totalItems, requestedPage, limit) {
  const totalPages = Math.ceil(totalItems / limit);
  const page = Math.min(requestedPage, Math.max(1, totalPages));
  return { page, limit, totalItems, totalPages };
}

module.exports = { toProviderResponse, toServiceResponse, collectionMeta };
