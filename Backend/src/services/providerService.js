const ServiceProvider = require("../models/serviceProvider");
const AppError = require("../utils/AppError");
const { createProviderProfileSchema } = require("../validators/providerValidator");
const { toProviderResponse, collectionMeta } = require("../utils/catalogResponse");
const { getPublicServices, listServices } = require("./serviceService");
const { getProviderRatingSummaries } = require("./reviewService");

async function createAndUpdateProviderProfile({ userId, ...fields }) {
  let profile = await ServiceProvider.findOne({ user: userId });
  if (!profile) {
    const result = createProviderProfileSchema.safeParse(fields);
    if (!result.success) {
      throw new AppError("Complete all required provider profile fields.", 400, "VALIDATION_ERROR",
        result.error.issues.map((issue) => ({
          field: ["body", ...issue.path].join("."), message: issue.message,
        })));
    }
    // The unique user index prevents duplicate profiles during concurrent onboarding.
    profile = await ServiceProvider.create({ ...result.data, user: userId });
  } else {
    profile = await ServiceProvider.findOneAndUpdate(
      { user: userId }, { $set: fields }, { returnDocument: "after", runValidators: true }
    );
    if (!profile) throw new AppError("Provider profile not found.", 404, "SERVICE_PROVIDER_PROFILE_NOT_FOUND");
  }
  return toProviderResponseWithRating(profile, { own: true });
}

async function getMyProfile({ userId }) {
  return toProviderResponseWithRating(await ServiceProvider.findOne({ user: userId }), { own: true });
}

async function getPublicProvider({ providerId, page = 1, limit = 10 }) {
  const profile = await ServiceProvider.findById(providerId).populate("user", "status role");
  if (!profile?.user || profile.user.status !== "active" || profile.user.role !== "provider") {
    throw new AppError("Provider profile not found.", 404, "SERVICE_PROVIDER_PROFILE_NOT_FOUND");
  }
  const result = await getPublicServices({ providerId, page, limit });
  return {
    ...(await toProviderResponseWithRating(profile)),
    services: result.services,
    serviceMeta: result.meta,
  };
}

async function getMyServices({ userId, status, page = 1, limit = 10 }) {
  const profile = await ServiceProvider.findOne({ user: userId });
  if (!profile) return { services: [], meta: collectionMeta(0, page, limit) };
  return listServices(
    { provider: profile._id, ...(status ? { status } : {}) },
    { page, limit, sort: { createdAt: -1, _id: -1 } }
  );
}

async function toProviderResponseWithRating(profile, options = {}) {
  if (!profile) return null;

  const summaries = await getProviderRatingSummaries([profile._id]);

  return toProviderResponse(profile, {
    ...options,
    ratingSummary: summaries.get(String(profile._id)),
  });
}

module.exports = { createAndUpdateProviderProfile, getMyProfile, getPublicProvider, getMyServices };
