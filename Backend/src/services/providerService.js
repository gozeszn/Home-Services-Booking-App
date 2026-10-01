const ServiceProvider = require("../models/serviceProvider");
const Service = require("../models/services");
const AppError = require("../utils/AppError");


async function createAndUpdateProviderProfile({
  userId,
  description,
  availabilitySummary,
  displayName,
  phone,
  serviceArea,
}) {
  const existingProfile = await ServiceProvider.findOne({ user: userId });

  if (!existingProfile) {
    const profile = await ServiceProvider.create({
      user: userId,
      displayName,
      description,
      phone,
      serviceArea,
      availabilitySummary,
    });

    return profile;
  }

  if (displayName !== undefined) {
    existingProfile.displayName = displayName;
  }

  if (description !== undefined) {
    existingProfile.description = description;
  }

  if (phone !== undefined) {
    existingProfile.phone = phone;
  }

  if (serviceArea !== undefined) {
    existingProfile.serviceArea = serviceArea;
  }

  if (availabilitySummary !== undefined) {
    existingProfile.availabilitySummary = availabilitySummary;
  }

  await existingProfile.save();

  return existingProfile;
}

async function getMyProfile({userId}) {
  const profile = await ServiceProvider.findOne({ user: userId });  
    if (!profile) {
        throw new AppError( 
            "Service provider profile not found.",
            404,
            "SERVICE_PROVIDER_PROFILE_NOT_FOUND"
        );
    }
    return profile;
}

async function getPublicProvider({ providerId }) {
  const profile = await ServiceProvider.findById(providerId)
    .populate("user", "fullName status");

  if (!profile) {
    throw new AppError(
      "Service provider profile not found.",
      404,
      "SERVICE_PROVIDER_PROFILE_NOT_FOUND"
    );
  }

  if (profile.user.status !== "active") {
    throw new AppError(
      "Service provider is not active.",
      404,
      "SERVICE_PROVIDER_NOT_ACTIVE"
    );
  }

  return profile;
}


async function getMyServices({ userId, status, page = 1, limit = 10 }) {
  const profile = await ServiceProvider.findOne({ user: userId });

  if (!profile) {
    throw new AppError(
      "Service provider profile not found.",
      404,
      "SERVICE_PROVIDER_PROFILE_NOT_FOUND"
    );
  }

  const filter = { provider: profile._id };

  if (status !== undefined) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const [services, total] = await Promise.all([
    Service.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Service.countDocuments(filter),
  ]);

  return {
    services,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}



module.exports = {
  createAndUpdateProviderProfile,
  getMyProfile,
  getPublicProvider,
  getMyServices
};
