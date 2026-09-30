
const ServiceProvider = require("../models/serviceProvider");
const Service = require("../models/services");
const AppError = require("../utils/AppError");
const serviceController = require('../controllers/serviceController')
const Category = require("../models/category");

async function createProviderProfile({
  userId,
  description,
  availabilitySummary,
}) {
  const existingProfile = await ServiceProvider.exists({ user: userId });

  if (existingProfile) {
    throw new AppError(
      "Provider profile already exists",
      409,
      "PROVIDER_PROFILE_EXISTS"
    );
  }

  let profile;

  try {
    profile = await ServiceProvider.create({
      user: userId,
      description,
      availabilitySummary,
    });
  } catch (error) {
    // The unique index also protects against simultaneous profile creation.
    if (error.code === 11000 && error.keyPattern?.user) {
      throw new AppError(
        "Provider profile already exists",
        409,
        "PROVIDER_PROFILE_EXISTS"
      );
    }

    throw error;
  }

  return profile;
}


async function serviceCreate({title, description, price, categoryId, pricingUnit, availabilitySummary, serviceArea, provider}) {
  const providerProfile = await ServiceProvider.findOne({user: provider}); //points to the user id of the provider variable passed in the function

  if(!providerProfile) {
    throw new AppError(
        "Service provider not found.",
        404,
        "SERVICE_PROVIDER_NOT_FOUND"
    );
  }

  const categoryIdExists = await Category.findOne({_id: categoryId, status: "active"});
  if (!categoryIdExists){
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

async function updateService({title, description, price, categoryId, pricingUnit, serviceArea, availabilitySummary, serviceId, provider}) {
    const providerExists = await ServiceProvider.findOne({user: provider});

    if(!providerExists){
       throw new AppError(
        "Service provider not found.",
        404,
        "SERVICE_PROVIDER_NOT_FOUND"
    );
    };

    const service = await Service.findOne(
        { _id: serviceId, provider: providerExists._id }
      );
       if(!service) {
        throw new AppError(
            "Service not found for the given provider.",
            404,
            "SERVICE_NOT_FOUND"
          );
        }
        
      if(title !== undefined) {service.title = title;}
      if(description !== undefined) {service.description = description;}
      if(price !== undefined) {service.price = price;}

      if(categoryId !== undefined) {
        const categoryCheck = await Category.findOne({_id: categoryId, status: "active"});
      
    if(!categoryCheck){
      throw new AppError(
        "category is not found or inactive",
        404,
        "CATEGORY_NOT_FOUND_OR_INACTIVE"
      )}

      service.categoryId = categoryId;
    }

      if(pricingUnit !== undefined) {
        service.pricingUnit = pricingUnit;
      }
      if(serviceArea !== undefined) {
        service.serviceArea = serviceArea;
      }
      if(availabilitySummary !== undefined) {
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
    { new: true }
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
  const providerExists = await ServiceProvider.findOne({user: provider});
  if(!providerExists){
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

  if (!service || !service.provider || service.provider.user.status !== "active") {
    throw new AppError(
      "Service not found",
      404,
      "SERVICE_NOT_FOUND"
    );
  }

  return service;
}

module.exports = {
  createProviderProfile,
  serviceCreate,
  updateService,
  updateServiceStatus,
  viewService,
  getServiceById
};




