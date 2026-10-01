const Category = require("../models/category");
const { escapeRegex } = require("../utils/catalogRules");

async function getAllCategories({ q } = {}) {
  const categories = await Category.find({
    status: "active", ...(q ? { name: { $regex: escapeRegex(q), $options: "i" } } : {}),
  }).sort({ name: 1, _id: 1 });
  return categories.map((category) => ({ id: String(category._id), name: category.name }));
}

module.exports = { getAllCategories };
