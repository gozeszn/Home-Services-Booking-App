const express = require("express");
const controller = require("../controllers/providerController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const { updateProviderProfileSchema } = require("../validators/providerValidator");
const { providerParams, ownServicesQuery, providerServicesQuery } = require("../validators/catalogSchemas");

const router = express.Router();

router.get("/me", authenticate, authorize("provider"), controller.getMyProfile);
router.patch("/me", authenticate, authorize("provider"),
  validate({ body: updateProviderProfileSchema }), controller.createAndUpdateProviderProfile);
router.get("/me/services", authenticate, authorize("provider"),
  validate({ query: ownServicesQuery }), controller.getMyServices);
router.get("/:providerId",
  validate({ params: providerParams, query: providerServicesQuery }), controller.getPublicProvider);

module.exports = router;
