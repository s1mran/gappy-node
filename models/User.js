const { KeyObject } = require("crypto");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const currencySchema = new Schema({
    currency: String,
    money: Number
});

const bankDetails = new Schema ({
    ifscCode :String,
    address: String,
    branch: String,
    bankName: String,
    accountNumber: String,
    accountHolderName: String,
  })

// Create Schema
const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        minlength: 1
    },
    password: {
        type: String,
        required: true,
        minlength: 1
    },
    date: {
        type: Date,
        default: Date.now
    },
    currencies: [currencySchema],
    createdAt: {
        type: Date,
        immutable: true,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    forgPassToken: {
        type: String,
    },
    contactNo: {
        type: String
    },
    bankDetails: bankDetails
});


module.exports = User = mongoose.model("users", UserSchema);