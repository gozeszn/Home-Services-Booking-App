const express = require("express");
const serviceController = require("../controllers/serviceController");
const validate = require("../middleware/validate");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const {updateServiceSchema }= require("../Validators/serviceValidator.js");

const router = express.Router();


router.post("/", authenticate, authorize("provider"), serviceController.createService);

router.get("/", serviceController.serviceView);

router.get("/:serviceId", serviceController.getServiceById);

router.patch("/:serviceId",authenticate, authorize("provider"),   validate({ body: updateServiceSchema }), serviceController.updateService);

router.patch("/:serviceId/status",authenticate, authorize("provider"), serviceController.statusUpdate);


module.exports = router;