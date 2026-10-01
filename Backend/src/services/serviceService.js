const ServiceProvider = require("../models/serviceProvider");
const Service = require("../models/services");
const User = require("../models/User");
const Category = require("../models/category");
const AppError = require("../utils/AppError");
const { escapeRegex } = require("../utils/catalogRules");
const { toServiceResponse, collectionMeta } = require("../utils/catalogResponse");

const servicePopulation = [
  { path: "provider", select: "displayName user", populate: { path: "user", select: "status role" } },
  { path: "categoryId", select: "name status" },
];

async function requireProvider(userId) {
  const profile = await ServiceProvider.findOne({ user: userId });
  if (!profile) {
    throw new AppError("Complete your provider profile first.", 404, "SERVICE_PROVIDER_PROFILE_NOT_FOUND");
  }
  return profile;
}

async function requireActiveCategory(categoryId) {
  if (!await Category.exists({ _id: categoryId, status: "active" })) {
    throw new AppError("Category not found or inactive.", 404, "CATEGORY_NOT_FOUND_OR_INACTIVE");
  }
}

async function serviceCreate({ provider, ...fields }) {
  const profile = await requireProvider(provider);
  await requireActiveCategory(fields.categoryId);
  const service = await Service.create({ ...fields, provider: profile._id, currency: "NGN", status: "inactive" });
  await service.populate(servicePopulation);
  return toServiceResponse(service);
}

async function updateService({ serviceId, provider, ...fields }) {
  const profile = await requireProvider(provider);
  // Query ownership before checking any submitted category.
  const service = await Service.findOne({ _id: serviceId, provider: profile._id });
  if (!service) throw new AppError("Service not found.", 404, "SERVICE_NOT_FOUND");
  if (fields.categoryId !== undefined) await requireActiveCategory(fields.categoryId);

  // Atomic field-level updates preserve other concurrent edits and legacy records.
  const updated = await Service.findOneAndUpdate(
    { _id: serviceId, provider: profile._id },
    { $set: fields },
    { returnDocument: "after", runValidators: true }
  ).populate(servicePopulation);
  if (!updated) throw new AppError("Service not found.", 404, "SERVICE_NOT_FOUND");
  return toServiceResponse(updated);
}

async function updateServiceStatus({ serviceId, provider, status }) {
  const profile = await requireProvider(provider);
  const existing = await Service.findOne({ _id: serviceId, provider: profile._id });
  if (!existing) throw new AppError("Service not found.", 404, "SERVICE_NOT_FOUND");
  if (status === "active") await requireActiveCategory(existing.categoryId);

  const updated = await Service.findOneAndUpdate(
    { _id: serviceId, provider: profile._id },
    { $set: { status } },
    { returnDocument: "after", runValidators: true }
  ).populate(servicePopulation);
  if (!updated) throw new AppError("Service not found.", 404, "SERVICE_NOT_FOUND");
  return toServiceResponse(updated);
}

async function getServiceById({ serviceId }) {
  const service = await Service.findOne({ _id: serviceId, status: "active" })
    .populate(servicePopulation);

  if (!service || !service.provider?.user ||
      service.provider.user.status !== "active" || service.provider.user.role !== "provider" ||
      service.categoryId?.status !== "active") {
    throw new AppError("Service not found.", 404, "SERVICE_NOT_FOUND");
  }
  return toServiceResponse(service);
}

async function listServices(filter, { page = 1, limit = 10, sort = { title: 1, _id: 1 } } = {}) {
  const total = await Service.countDocuments(filter);
  const meta = collectionMeta(total, page, limit);
  const services = await Service.find(filter).sort(sort)
    .skip((meta.page - 1) * limit).limit(limit).populate(servicePopulation);
  return { services: services.map(toServiceResponse), meta };
}

async function getPublicServices({
  q, category, location, minPrice, maxPrice, sort = "title", page = 1, limit = 10, providerId,
}) {
  const activeUsers = await User.find({ role: "provider", status: "active" }).distinct("_id");
  const providers = await ServiceProvider.find({
    user: { $in: activeUsers },
    ...(providerId ? { _id: providerId } : {}),
  }).select("_id displayName").lean();
  const activeCategories = await Category.find({
    status: "active", ...(category ? { _id: category } : {}),
  }).distinct("_id");
  const filter = {
    status: "active",
    provider: { $in: providers.map((profile) => profile._id) },
    categoryId: { $in: activeCategories },
  };

  if (q) {
    const literal = escapeRegex(q);
    const matchingProviders = providers
      .filter((profile) => profile.displayName.toLowerCase().includes(q.toLowerCase()))
      .map((profile) => profile._id);
    filter.$or = [
      { title: { $regex: literal, $options: "i" } },
      { description: { $regex: literal, $options: "i" } },
      { provider: { $in: matchingProviders } },
    ];
  }
  if (location) filter.serviceArea = { $regex: escapeRegex(location), $options: "i" };
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {
      ...(minPrice !== undefined ? { $gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
    };
  }
  const sorts = {
    title: { title: 1, _id: 1 },
    newest: { createdAt: -1, _id: -1 },
    "price-asc": { price: 1, _id: 1 },
    "price-desc": { price: -1, _id: 1 },
  };
  return listServices(filter, { page, limit, sort: sorts[sort] || sorts.title });
}

module.exports = { serviceCreate, updateService, updateServiceStatus, getServiceById, getPublicServices, listServices };
