
const ServiceProvider = require("../models/serviceProvider");
const Service = require("../models/services");
const AppError = require("../utils/AppError");
const serviceController = require('../controllers/serviceController')

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


async function serviceCreate({title, description, price, category, status, priceUnit, provider}) {
  const providerExists = await ServiceProvider.findByOne({user: provider}); //points to the user id of the provider variable passed in the function

  if(!providerExists) {
    throw new AppError(
        "Service provider not found.",
        404,
        "SERVICE_PROVIDER_NOT_FOUND"
    );
  }

  let service;
  try{
       service = await Service.create({
        title,
        description,
        price,
        category,
        status,
        priceUnit,
        provider: provider._id
      });
    
      return service;

  }catch(error) {
    if (error.code === 11000) {
      throw new AppError(
        "A service with these unique details already exists.",
        409,
        "DUPLICATE_SERVICE"
      );
    }
    throw error;
}}



async function serviceUpdate({serviceId, title, description, price, category, priceUnit, status, provider}){
    const providerExists = await ServiceProvider.findOne({user: provider});

    if(!providerExists){
       throw new AppError(
        "Service provider not found.",
        404,
        "SERVICE_PROVIDER_NOT_FOUND"
    );
    };

    let service;

    try{
      service = await Service.findOneAndUpdate(
        { _id: serviceId, provider: providerExists._id },
        {title, description, price, category, priceUnit, status},
        {new: true}
      );
    }catch(error){

      if (error.code === 11000) {
        throw new AppError(
          "A service with these unique details already exists.",
          409,
          "DUPLICATE_SERVICE"
        );
      }
      throw error;
    }
}










module.exports = {
  createProviderProfile,
  serviceCreate,
  serviceUpdate
};

