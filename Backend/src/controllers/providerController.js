const providerService = require("../Services/providerService");

async function createAndUpdateProviderProfile(req, res) {
  const { description, availabilitySummary, displayName, phone, serviceArea } = req.validated.body;
  const result = await providerService.createAndUpdateProviderProfile({
    userId: req.user._id,
    description,
    availabilitySummary,
    displayName,
    phone,
    serviceArea
  });
  return res.status(201).json({
    success: true,
    data: result,
  });
}

async function getMyProfile(req, res) {
    console.log("Get my profile called");
  const result = await providerService.getMyProfile({
    userId: req.user._id
  });
  return res.status(200).json({
    success: true,
    data: result,
  });
}

async function getPublicProvider(req, res) {
  const result = await providerService.getPublicProvider({
    providerId: req.params.providerId,
  });

  return res.status(200).json({
    success: true,
    data: result,
  });
}

async function getMyServices(req, res) {
  const { status, page, limit } = req.query;

  const result = await providerService.getMyServices({
    userId: req.user._id,
    status,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
  });

  return res.status(200).json({
    success: true,
    data: result.services,
    pagination: result.pagination,
  });
}

module.exports = {
  createAndUpdateProviderProfile,
  getMyProfile,
  getPublicProvider,
  getMyServices
}
 