const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceProvider",
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
        maxlength: 200
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Category"
    },
    pricingUnit: {
        type: String,
        enum: ["per hour", "per service", "per day"],
        required: true
    },
    serviceArea:{
        type: String,
        required: true,
          trim: true,
        maxlength: 500
    },
    availabilitySummary:{
        type: String,
        required: true,
        trim: true,
        maxlength: 500

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
