let express = require("express");
const router = express.Router();
const crypto = require("crypto");
const razorpay = require("razorpay");
const Gift = require("../../models/Gift");
const {sendMail, createMailBody} = require('../../utils/mailer')
const { createRandomInt } = require('../../utils/commons')
const { minRandNum, maxRandNum } = require('../../config/constants');

const instance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

router.post("/new-order", (req, res) => {
    params = req.body;
    instance
        .orders
        .create(params)
        .then((data) => {
            res.send({ sub: data, status: "success" });
        })
        .catch((error) => {
            res.send({ sub: error, status: "failed" });
        })
})

router.post("/verify-and-buy-gift", (req, res) => {
    const { orderId, paymentId, sig, currency, units, deliveryType, deliveryDateTime, recipientName, senderName, recipientEmail, senderEmail } = JSON.parse(JSON.stringify(req.body));
    console.log(req.body, req.body.orderId, paymentId, sig, currency, units, deliveryType, deliveryDateTime, recipientName, senderName, recipientEmail, senderEmail)
    let data = orderId + "|" + paymentId;
    let signature = crypto
        .createHmac("sha256", process.env.KEY_SECRET)
        .update(data.toString())
        .digest("hex");
    if (signature !== sig) {
        const reedemCode = "CRYFT" + createRandomInt(minRandNum, maxRandNum);
        const mailBody = createMailBody(recipientName, senderName, currency, reedemCode);
        const newGift = new Gift({
            currency: currency, units: units, deliveryType: deliveryType, deliveryDateTime: deliveryDateTime, recipientName: recipientName, 
            senderName: senderName, recipientEmail: recipientEmail, senderEmail: senderEmail, subject: subject, message: mailBody, reedemCode: reedemCode
        });
        newGift.save().then(
            () => {
                sendMail(subject, message, senderEmail, recipientEmail);
                res.send({ status: "success" });
            }
        )
    }
    else
        res.send({ status: "Failure :: signature did not match" });
})

module.exports = router;