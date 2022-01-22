const { Decipher } = require("crypto");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// Create Schema
const GiftSchema = new Schema({
    currency: {
        type: String,
        required: true
    },
    currencyName: {
        type: String
    },
    money: {
        type: String,
        required: true
    },
    recipientName: {
        type: String,
    },
    recipientEmail: {
        type: String,
        required: true
    },
    senderId: {
        type: String,
        required: true
    },
    subject: {
        type: String,
    },
    deliveryType: {
        type: String,
        default: 'email'
    },
    deliveryDateTime: {
        type: Date,
        default: Date.now
    },
    redeemCode: {
        type: String,
        required: true
    },
    redeemed: {
        type: Boolean,
        default: false
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
    redeemedAt: {
        type: Date
    },
    executedQuantity: Number,
    buyPrice: Number
});

module.exports = User = mongoose.model("gifts", GiftSchema);