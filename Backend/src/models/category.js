const mongoose = require('mongoose');


const CategorySchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true,
        maxlength: 100
       
    },
    status:{
        type: String,
        enum: ["inactive", "active"],
        default: "active"
    }
},
{
    timestamps: true
})


const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;