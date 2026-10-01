
const ServiceProvider = require("../models/serviceProvider");
const Service = require("../models/services");
const AppError = require("../utils/AppError");
const Category = require("../models/category");



async function serviceCreate({ title, description, price, categoryId, pricingUnit, availabilitySummary, serviceArea, provider }) {
  const providerProfile = await ServiceProvider.findOne({ user: provider }); //points to the user id of the provider variable passed in the function

  if (!providerProfile) {
    throw new AppError(
      "Service provider not found.",
      404,
      "SERVICE_PROVIDER_NOT_FOUND"
    );
  }

  const categoryIdExists = await Category.findOne({ _id: categoryId, status: "active" });
  if (!categoryIdExists) {
    throw new AppError(
      "category not found or inactive", 404, "CATEGORYID_NOT_FOUND_OR_INACTIVE"
    )
  }
  let service;

  service = await Service.create({
    title,
    description,
    price,
    categoryId,
    pricingUnit,
    availabilitySummary,
    serviceArea,
    provider: providerProfile._id
  });

  return service;

}

//Update service function

async function updateService({ title, description, price, categoryId, pricingUnit, serviceArea, availabilitySummary, serviceId, provider }) {
  const providerExists = await ServiceProvider.findOne({ user: provider });

  if (!providerExists) {
    throw new AppError(
      "Service provider not found.",
      404,
      "SERVICE_PROVIDER_NOT_FOUND"
    );
  };

  const service = await Service.findOne(
    { _id: serviceId, provider: providerExists._id }
  );
  if (!service) {
    throw new AppError(
      "Service not found for the given provider.",
      404,
      "SERVICE_NOT_FOUND"
    );
  }

  if (title !== undefined) { service.title = title; }
  if (description !== undefined) { service.description = description; }
  if (price !== undefined) { service.price = price; }

  if (categoryId !== undefined) {
    const categoryCheck = await Category.findOne({ _id: categoryId, status: "active" });

    if (!categoryCheck) {
      throw new AppError(
        "category is not found or inactive",
        404,
        "CATEGORY_NOT_FOUND_OR_INACTIVE"
      )
    }

    service.categoryId = categoryId;
  }

  if (pricingUnit !== undefined) {
    service.pricingUnit = pricingUnit;
  }
  if (serviceArea !== undefined) {
    service.serviceArea = serviceArea;
  }
  if (availabilitySummary !== undefined) {
    service.availabilitySummary = availabilitySummary;
  }

  await service.save();
  return service;

}


//update service status function

async function updateServiceStatus({ serviceId, provider, status }) {
  const providerExists = await ServiceProvider.findOne({ user: provider });

  if (!providerExists) {
    throw new AppError(
      "Service provider not found.",
      404,
      "SERVICE_PROVIDER_NOT_FOUND"
    );
  }

  const service = await Service.findOneAndUpdate(
    { _id: serviceId, provider: providerExists._id },
    { status },
    { returnDocument: "after" }
  );

  if (!service) {
    throw new AppError(
      "Service not found for the given provider.",
      404,
      "SERVICE_NOT_FOUND"
    );
  }
  return service;
}

async function viewService({ serviceId, provider }) {
  const providerExists = await ServiceProvider.findOne({ user: provider });
  if (!providerExists) {
    throw new AppError(
      'The service provider profile was not found', 404, "NO_PROVIDER_FOUND"
    );
  }
  const service = await Service.findOne(
    {
      _id: serviceId,
      provider: providerExists._id
    }
  );
  if (!service) {
    throw new AppError(
      "Service not found for the given provider.",
      404,
      "SERVICE_NOT_FOUND"
    );
  }
  return service;
}

// Function to get a service by its ID, ensuring it is active and the provider is also active

async function getServiceById({ serviceId }) {
  const service = await Service.findOne({
    _id: serviceId,
    status: "active"
  }).populate({
    path: "provider",
    populate: {
      path: "user",
      select: "fullName status"
    }
  });

  if (!service) {
    throw new AppError(
      "Service not found",
      404,
      "SERVICE_NOT_FOUND"
    );
  }


  if (!service.provider.user || !service.provider || service.provider.user.status !== "active") {
    throw new AppError(
      "Service not found",
      404,
      "SERVICE_NOT_FOUND"
    );
  }

  return service;
}


async function getPublicServices({
  q,
  category,
  location,
  minPrice,
  maxPrice,
  sort,
  page = 1,
  limit = 10
}) {
  const activeProviders = await ServiceProvider.find()
    .populate("user", "status");

  const activeProviderIds = activeProviders
    .filter((provider) => provider.user && provider.user.status === "active")
    .map((provider) => provider._id);

  const filter = {
    status: "active",
    provider: { $in: activeProviderIds }
  };

  if (q) {
    filter.title = { $regex: q, $options: "i" };
  }

  if (category) {
    filter.categoryId = category;
  }

  if (location) {
    filter.serviceArea = { $regex: location, $options: "i" };
  }

  if (minPrice !== undefined) {
    filter.price = {
      ...filter.price,
      $gte: minPrice
    };
  }

  if (maxPrice !== undefined) {
    filter.price = {
      ...filter.price,
      $lte: maxPrice
    };
  }

  let sortOption = { createdAt: -1 };

  if (sort === "price_asc") {
    sortOption = { price: 1 };
  }

  if (sort === "price_desc") {
    sortOption = { price: -1 };
  }

  const skip = (page - 1) * limit;

  const [services, total] = await Promise.all([
    Service.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit),

    Service.countDocuments(filter)
  ]);

  return {
    services,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}




module.exports = {
  serviceCreate,
  updateService,
  updateServiceStatus,
  viewService,
  getServiceById,
  getPublicServices
};




