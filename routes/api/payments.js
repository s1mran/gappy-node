let express = require("express");
const router = express.Router();
const crypto = require("crypto");
const razorpay = require("razorpay");
const Gift = require("../../models/Gift");
const { sendMail, createMailSubject } = require('../../utils/mailer')
const { createRandomInt } = require('../../utils/commons')
const { minRandNum, maxRandNum } = require('../../config/constants');
const auth = require("../../middleware/auth");

const instance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

router.post("/new-order", auth, (req, res) => {
    if (!req.user._id)
        res.status(401).send("User unauthorized")
    let params = req.body;
    instance
        .orders
        .create(params)
        .then((data) => {
            res.status(201).send(data);
        })
        .catch((error) => {
            res.status(400).send(error);
        })
})

// {
//     "orderId": "11", "paymentId": "11", "sig": "111", "currency": "btc", "units": "0.001", "deliveryType": "email", "recipientName": "nisha", 
//     "senderName": "simran", "recipientEmail": "kaursimransidhu1@gmail.com", "senderEmail": "nishaposwal321@gmail.com", "subject": "test mail cryft", "message": " cryft message"
// }

router.post("/verify-and-add-gift", auth, async (req, res) => {
    if (!req.user._id)
        res.status(401).send("User unauthorized")

    const { orderId, paymentId, sig, ...rest } = req.body;
    const { currency, deliveryDateTime, recipientName, recipientEmail } = rest;

    let data = orderId + "|" + paymentId;
    let signature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(data.toString())
        .digest("hex");

    if (signature == sig) {
        const reedemCode = "CRYFT" + createRandomInt(minRandNum, maxRandNum);
        const subject = createMailSubject(req.user.name);
        const newGift = new Gift({
            ...rest,
            subject: subject,
            message: "mailBody",
            reedemCode: reedemCode,
            senderId: req.user._id
        });

        try {
            await sendMail(subject, req.user.name, req.user.email, recipientName, recipientEmail, currency, reedemCode);
        } catch (e) {
            res.status(500).send(e);
        }

        newGift.save().then(
            () => {
                res.status(201).json({ success: true, message: "Gift Added" });
            }
        )
    }
    else
        res.status(400).send("Failure :: signature did not match");
})

module.exports = router;