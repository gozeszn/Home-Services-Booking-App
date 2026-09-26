const mongoose = require("mongoose");
const User = require("./User");

const serviceSchema = new mongoose.Schema({
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        trim: true,
        required: true,
        maxlength: 500
    },
    category: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    priceUnit: {
        type: String,
        enum: ["per hour", "per service", "per day"],
        required: true
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    }
},
{
    timestamps: true
});

const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;
