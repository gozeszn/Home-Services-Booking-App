const express = require("express");
const serviceController = require("../controllers/serviceController");
const providerController = require("../controllers/providerController");
const validate = require("../middleware/validate");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const {createServiceSchema, updateServiceSchema, statusUpdateSchema }= require("../Validators/serviceValidator.js");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("provider"),
    validate({ body: createServiceSchema }),
  serviceController.createService
);

router.get("/", serviceController.getPublicServices);

router.get("/:serviceId", serviceController.getServiceById);

router.patch("/:serviceId",authenticate, authorize("provider"),   validate({ body: updateServiceSchema }), serviceController.updateService);

router.patch("/:serviceId/status",authenticate, authorize("provider"),   validate({ body: statusUpdateSchema }), serviceController.statusUpdate);


module.exports = router;