let express = require("express");
const router = express.Router();
const crypto = require("crypto");
const request = require('request');
const Gift = require("../../models/Gift");
const User = require("../../models/User");
const auth = require("../../middleware/auth");
const { waitForOrderFulfilled, queryOrder } = require('../../utils/buy-sell')

var apiKey = process.env.WZRX_API_KEY;
var secretKey = process.env.WZRX_SECRET_KEY;

router.post("/redeem-gift", auth, async (req, res) => {
    if (!req.user._id)
        res.status(401).send("User unauthorized")
    var redeemCode = req.body.reedemCode
    if (redeemCode == 'this_is_redeemed')
        res.status(400).send('Invalid redeem code');
    Gift.findOne({ 'redeemCode': redeemCode }).then((gift) => {
        if (!gift) {
            return res.status(404).send("Invalid redeem code");
        }
        if (gift.redeemed)
            return res.status(400).send("Gift has already been redeemed")

        const { currency, money } = gift
        var timestamp = new Date().getTime();

        var priceUrl = 'https://api.wazirx.com/sapi/v1/ticker/24hr?symbol=' + currency;
        request({
            url: priceUrl,
            method: "GET"
        }, function (error, response, body) {
            if (error)
                return res.send(500).send(error);
            var lastPrice = JSON.parse(response.body).lastPrice;
            var quantity = (money) / (lastPrice);
            Gift.updateOne({ 'redeemCode': redeemCode }, { 'redeemed': true, 'redeemDate': new Date(), 'redeemCode': 'this_is_redeemed' }, function (err, docs) {
                if (err) {
                    console.log(err)
                }
                else {
                    console.log("Updated Gift : ", docs);
                    User.findByIdAndUpdate(req.user._id, { "$push": { "currencies": { 'currency': currency, 'money': money }, } }, function (err, docs) {
                        if (err) {
                            console.log(err)
                        }
                        else {
                            console.log("Updated User : ", docs);
                            res.status(201).send('Gift Redeemed');
                        }
                    })

                }
            })

            //     var data = 'symbol=' + currency + '&side=buy&price=' + lastPrice + '&type=limit&quantity=' + quantity + '&recvWindow=10000&timestamp=' + timestamp;
            //     let signature = crypto
            //         .createHmac("sha256", secretKey)
            //         .update(data)
            //         .digest("hex");

            //     console.log(lastPrice)
            //     console.log(quantity)
            //     data += '&signature=' + signature;
            //     request({
            //         url: "https://api.wazirx.com/sapi/v1/order/test",
            //         method: "POST",
            //         headers: {
            //             'x-api-key': apiKey,
            //             'Content-Type': 'application/x-www-form-urlencoded',
            //         },
            //         body: data
            //     }, async function (error, response, body) {
            //         if (error)
            //             return res.status(500).send(error)
            //         if (response) {
            //             console.log(response)
            //             function runInterval() {
            //                 console.log(response.body)
            //                 queryOrder('1984133429', (resp) => {
            //                     if (resp.error) {
            //                         clearInterval(this);
            //                         res.status(500).send(resp.error)
            //                     }
            //                     if (resp.resp) {
            //                         console.log(JSON.parse(resp.resp.body))
            //                         if (JSON.parse(resp.resp.body).status == 'done') {
            //                             clearInterval(this);
            //                             Gift.updateOne({ 'redeemCode': redeemCode }, { 'redeemed': true, 'redeemDate': new Date(), 'redeemCode': 'this_is_redeemed' }, function (err, docs) {
            //                                 if (err) {
            //                                     console.log(err)
            //                                 }
            //                                 else {
            //                                     console.log("Updated Docs : ", docs);
            //                                     res.status(201).send('Gift Redeemed');
            //                                 }
            //                             })

            //                         }
            //                     }
            //                 })
            //             }
            //             setInterval(runInterval, 2000);
            //         }
            //     });
        });
    })
})

router.get("/history", auth, async (req, res) => {
    if (!req.user._id)
        res.status(401).send("User unauthorized")
    Gift.find({senderId: req.user._id}, {redeemCode: false, _id: false}).then(resp => res.status(200).send(resp))
})

module.exports = router;