const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// Create Schema
const GiftSchema = new Schema({
    currency: {
        type: String,
        required: true
    },
    units: {
        type: String,
        required: true
    },
    recipientName: {
        type: String,
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    recipientEmail: {
        type: String,
        required: true
    },
    senderEmail: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    deliveryType: {
        type: String,
        default: 'email'
    },
    deliveryDateTime: {
        type: Date,
        default: Date.now
    },
    reedemCode: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        immutable: true,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
});

module.exports = User = mongoose.model("gifts", GiftSchema);