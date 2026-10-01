const express = require("express");
const controller = require("../controllers/serviceController");
const validate = require("../middleware/validate");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const { createServiceSchema, updateServiceSchema, statusUpdateSchema } = require("../validators/serviceValidator");
const { serviceParams, publicServicesQuery } = require("../validators/catalogSchemas");

const router = express.Router();

router.get("/", validate({ query: publicServicesQuery }), controller.getPublicServices);
router.get("/:serviceId", validate({ params: serviceParams }), controller.getServiceById);
router.post("/", authenticate, authorize("provider"),
  validate({ body: createServiceSchema }), controller.createService);
router.patch("/:serviceId", authenticate, authorize("provider"),
  validate({ params: serviceParams, body: updateServiceSchema }), controller.updateService);
router.patch("/:serviceId/status", authenticate, authorize("provider"),
  validate({ params: serviceParams, body: statusUpdateSchema }), controller.statusUpdate);

module.exports = router;
