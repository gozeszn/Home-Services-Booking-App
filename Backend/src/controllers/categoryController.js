const Category = require("../models/category.js");
const categoryServices = require("../Services/categoryServices");

async function getAllCategories(req, res) {

        const categories = await categoryServices.getAllCategories();
    return res.status(200).json({
        success: true,
        data: categories
    });
    
}

module.exports = {
    getAllCategories
};
