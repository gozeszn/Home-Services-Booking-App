const providerService = require("../services/providerService");

async function createAndUpdateProviderProfile(req, res) {
  const data = await providerService.createAndUpdateProviderProfile({
    ...req.validated.body, userId: req.user._id,
  });
  return res.status(200).json({ success: true, data });
}

async function getMyProfile(req, res) {
  const data = await providerService.getMyProfile({ userId: req.user._id });
  return res.status(200).json({ success: true, data });
}

async function getPublicProvider(req, res) {
  const data = await providerService.getPublicProvider({
    ...req.validated.params, ...req.validated.query,
  });
  return res.status(200).json({ success: true, data });
}

async function getMyServices(req, res) {
  const data = await providerService.getMyServices({
    ...req.validated.query, userId: req.user._id,
  });
  return res.status(200).json({ success: true, data, meta: data.meta });
}

module.exports = { createAndUpdateProviderProfile, getMyProfile, getPublicProvider, getMyServices };
