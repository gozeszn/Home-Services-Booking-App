const categoryServices = require("../services/categoryServices");

async function getAllCategories(req, res) {
  const data = await categoryServices.getAllCategories(req.validated.query);
  return res.status(200).json({ success: true, data });
}

module.exports = { getAllCategories };
