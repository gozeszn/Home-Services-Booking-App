const Category = require("../models/category");


async function getAllCategories(){
    const getCategories = await Category.find({
        status: "active"   
    })
    return getCategories;
};

module.exports = {
    getAllCategories
};

