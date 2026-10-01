const express = require("express");
const controller = require("../controllers/categoryController");
const validate = require("../middleware/validate");
const { categoriesQuery } = require("../validators/catalogSchemas");

const router = express.Router();
router.get("/", validate({ query: categoriesQuery }), controller.getAllCategories);
module.exports = router;
