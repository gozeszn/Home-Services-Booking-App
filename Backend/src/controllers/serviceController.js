const serviceService = require("../Services/serviceService");

async function createProviderProfile(req, res) {
  const { description, availabilitySummary } = req.validated.body;
  const result = await serviceService.createProviderProfile({
    userId: req.user._id,
    description,
    availabilitySummary,
  });
  return res.status(201).json({
    success: true,
    data: result,
  });
}

async function createService(req, res) {
  const { title, description, price, category, status, priceUnit } = req.validated.body;
  const result = await serviceService.serviceCreate({
    title,
    description,
    price,
    category,
    status,
    priceUnit,
    provider: req.user._id
  });
  return res.status(201).json({
    success: true,
    data: result,
  });
}

async function updateService(req,res) {
  const { title, description, price, category, status, priceUnit } = req.validated.body;
  
    const result = await serviceService.updateService({
        serviceId: req.params.serviceId,
        provider: req.user._id,
        title,
        description,
        price,
        category,
        status,
        priceUnit
    });
    return res.status(200).json({
        success: true,
        data: result  
    })
}

async function statusUpdate(req,res) {
  const { status } = req.validated.body;
  const result = await serviceService.updateServiceStatus({
    serviceId: req.params.serviceId,
    provider: req.user._id,
    status
  });
  return res.status(200).json({
    success: true,
    data: result
  });
}

async function serviceView(req,res){

   const result = await serviceService.viewService({
      serviceId: req.params.serviceId,
        provider: req.user._id
   })
   return res.status(200).json(
    {success: true,
    data: result
  })
}





module.exports = {
    createProviderProfile,
    createService,
    updateService,
    statusUpdate,
    serviceView
}