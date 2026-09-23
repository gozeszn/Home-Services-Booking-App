const express = require("express");
const authenticate = require("../middleware/authenticate");
const validate = require("../middleware/validate");
const userController = require("../controllers/userController");
const { updateProfileSchema } = require("../validators/userSchemas");

const router = express.Router();

// Every route in this router requires authentication.
router.use(authenticate);

router.get("/me", userController.getMe);

router.patch(
  "/me",
  validate({ body: updateProfileSchema }),
  userController.updateMe
);

module.exports = router;