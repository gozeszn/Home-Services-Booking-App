const serviceService = require("../Services/serviceService");


async function createService(req, res) {
  const { title, description, price, categoryId, pricingUnit, serviceArea, availabilitySummary } = req.validated.body;
  const result = await serviceService.serviceCreate({
    title,
    description,
    price,
    categoryId,
    pricingUnit,
    availabilitySummary,
    serviceArea,
    provider: req.user._id
  });
  return res.status(201).json({
    success: true,
    data: result,
  });
}

async function updateService(req,res) {
  const { title, description, price, categoryId, pricingUnit, serviceArea, availabilitySummary } = req.validated.body;
  
    const result = await serviceService.updateService({
        serviceId: req.params.serviceId,
        provider: req.user._id,
        title,
        description,
        price,
        categoryId,
        pricingUnit,
        serviceArea,
        availabilitySummary
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

async function getServiceById(req, res) {
  const result = await serviceService.getServiceById({
    serviceId: req.params.serviceId
  });

  return res.status(200).json({
    success: true,
    data: result
  });
}


async function getPublicServices(req, res) {
  const {q, location,minPrice,maxPrice, category,sort, page, limit } = req.query;
  const result = await serviceService.getPublicServices({
    q,
    location,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    category,
    sort,
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
    createService,
    updateService,
    statusUpdate,
    serviceView,
    getServiceById,
    getPublicServices
}