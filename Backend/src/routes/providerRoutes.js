const providerController = require("../controllers/providerController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const { createProviderProfileSchema } = require("../Validators/providerValidator");
const express = require("express");
const router = express.Router();

router.get(
  "/me",
  authenticate,
  authorize("provider"),
  providerController.getMyProfile
);


router.patch("/me", authenticate, authorize("provider"), validate({ body: createProviderProfileSchema }), providerController.createAndUpdateProviderProfile);

router.get(
  "/:providerId",
  providerController.getPublicProvider
);

router.get(
  "/me/services",
  authenticate,
  authorize("provider"),
  providerController.getMyServices
);

module.exports = router;