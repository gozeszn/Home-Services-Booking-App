const serviceService = require("../services/serviceService");

async function createService(req, res) {
  const data = await serviceService.serviceCreate({ ...req.validated.body, provider: req.user._id });
  return res.status(201).json({ success: true, data });
}

async function updateService(req, res) {
  const data = await serviceService.updateService({
    ...req.validated.body, serviceId: req.validated.params.serviceId, provider: req.user._id,
  });
  return res.status(200).json({ success: true, data });
}

async function statusUpdate(req, res) {
  const data = await serviceService.updateServiceStatus({
    ...req.validated.body, serviceId: req.validated.params.serviceId, provider: req.user._id,
  });
  return res.status(200).json({ success: true, data });
}

async function getServiceById(req, res) {
  const data = await serviceService.getServiceById(req.validated.params);
  return res.status(200).json({ success: true, data });
}

async function getPublicServices(req, res) {
  const data = await serviceService.getPublicServices(req.validated.query);
  // Retain shared-envelope meta while keeping it available through apiRequest().
  return res.status(200).json({ success: true, data, meta: data.meta });
}

module.exports = { createService, updateService, statusUpdate, getServiceById, getPublicServices };
