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
        return res.status(401).send("User unauthorized")
    var redeemCode = req.body.reedemCode
    console.log(redeemCode)
    if (redeemCode == 'this_is_redeemed')
        return res.status(400).send('Invalid redeem code');
    Gift.findOne({ 'redeemCode': redeemCode }).then((gift) => {
        if (!gift) {
            return res.status(404).send("Invalid redeem code");
        }
        if (gift.redeemed)
            return res.status(400).send("Gift has already been redeemed")

        const { currency, money, currencyName } = gift
        var timestamp = new Date().getTime();

        var priceUrl = 'https://api.wazirx.com/sapi/v1/ticker/24hr?symbol=' + currency;
        request({
            url: priceUrl,
            method: "GET"
        }, function (error, response, body) {
            if (error)
                return res.send(500).send(error);
            var mg2 = JSON.parse(response.body).message;
            if (mg2 == 'symbol does not have a valid value'){
                return res.status(500).send(mg2)
            }
            var lastPrice = JSON.parse(response.body).lastPrice;

            // console.log(response.body)
            var quantity = (money) / (lastPrice);

            var data = 'symbol=' + currency + '&side=buy&price=' + lastPrice + '&type=limit&quantity=' + quantity + '&recvWindow=10000&timestamp=' + timestamp;
            let signature = crypto
                .createHmac("sha256", secretKey)
                .update(data)
                .digest("hex");

            console.log(lastPrice)
            console.log(quantity)
            data += '&signature=' + signature;
            request({
                url: "https://api.wazirx.com/sapi/v1/order",
                method: "POST",
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: data
            }, async function (error, response, body) {
                if (error)
                    return res.status(500).send(error)
                if (response) {
                    console.log(response)
                    function runInterval() {
                        // console.log(response.body)
                        const id = JSON.parse(response.body).id;
                        var mg1 = JSON.parse(response.body).message;
                        if (mg1 == 'symbol does not have a valid value' || !id){
                            res.status(500).send(mg1)
                        clearInterval(this);}
                        queryOrder(id, (resp) => {
                            if (resp.error) {
                                clearInterval(this);
                                return res.status(500).send(resp.error)
                            }
                            if (resp.resp) {
                                console.log(JSON.parse(resp.resp.body))
                                var data = JSON.parse(resp.resp.body);
                                var bal = money - Math.round(data.executedQty * data.price) - 1;
                                console.log(bal);
                                var mg = JSON.parse(resp.resp.body).message;
                                if (mg == 'orderId is invalid' || mg == 'Too many api request'){
                                    clearInterval(this);
                                    res.status(500).send(mg)
                                }
                                if (JSON.parse(resp.resp.body).status == 'done') {
                                    clearInterval(this);
                                    Gift.updateOne({ 'redeemCode': redeemCode }, {
                                        'redeemed': true,
                                        'redeemDate': new Date(),
                                        'redeemCode': 'this_is_redeemed',
                                        'executedQuantity': data.executedQty,
                                        'buyPrice': data.price
                                    }, function (err, docs) {
                                        if (err) {
                                            console.log(err)
                                        }
                                        else {
                                            // console.log("Updated Docs : ", docs);
                                            User.findById(req.user._id).then(user => {
                                                if (user) {
                                                    var currencies = user.currencies;
                                                    var done = false;
                                                    for (var i = 0; i < currencies.length; i++) {
                                                        if (currencies[i]['currency'] == currency) {
                                                            currencies[i]['quantity'] += new Number(data.executedQty);
                                                            currencies[i]['quantity'] = new Number(currencies[i]['quantity']).toFixed(5)
                                                            currencies[i]['currencyName'] = currencyName;
                                                            done = true;
                                                        }
                                                    }
                                                    if (!done)
                                                        currencies.push({ 'currency': currency, 'quantity': data.executedQty, 'currencyName': currencyName });
                                                    console.log(currencies)
                                                    User.findByIdAndUpdate(req.user._id, { currencies: currencies, $inc: { balance: bal } }, function (err, docs) {
                                                        if (err) {
                                                            console.log(err)
                                                        }
                                                        else {
                                                            // console.log("Updated User : ", docs);
                                                            return res.status(201).send({'success': 'Gift Redeemed'});
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })

                                }
                            }
                        })
                    }
                    setInterval(runInterval, 5000);
                }
            });
        });
    })
})

router.post("/sell-gift", auth, async (req, res) => {
    if (!req.user._id)
        return res.status(401).send("User unauthorized")
    var { currency, quantity } = req.body
    if (new Number(quantity) <= 0) 
        res.status(500).send("Invalid currency quantity")
    User.findOne({ _id: req.user._id, 'currencies.currency': currency, 'currencies.quantity': { $gte: new Number(quantity) } }).then(user => {
        if (!user)
            return res.status(404).send("No user with given currency and quantity");
        var currencies = user.currencies;
        var done = false;
        for (var i = 0; i < currencies.length; i++) {
            if (currencies[i]['currency'] == currency) {
                if (new Number(quantity) > currencies[i]['quantity'])
                    return res.status(404).send("User has less quantity of currency than input quantity");
                done = true;
            }
        }
        if (done) {
            var timestamp = new Date().getTime();

            var priceUrl = 'https://api.wazirx.com/sapi/v1/ticker/24hr?symbol=' + currency;
            request({
                url: priceUrl,
                method: "GET"
            }, function (error, response, body) {
                if (error)
                    return res.send(500).send(error);
                var mg2 = JSON.parse(response.body).message;
                if (mg2 == 'symbol does not have a valid value'){
                    res.status(500).send(mg2)
                }
                var lastPrice = JSON.parse(response.body).lastPrice;
                // console.log(response.body)
                var data = 'symbol=' + currency + '&side=sell&price=' + lastPrice + '&type=limit&quantity=' + quantity + '&recvWindow=10000&timestamp=' + timestamp;
                let signature = crypto
                    .createHmac("sha256", secretKey)
                    .update(data)
                    .digest("hex");

                console.log(lastPrice)
                console.log(quantity)
                data += '&signature=' + signature;
                request({
                    url: "https://api.wazirx.com/sapi/v1/order",
                    method: "POST",
                    headers: {
                        'x-api-key': apiKey,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: data
                }, async function (error, response, body) {
                    if (error)
                        return res.status(500).send(error)
                    if (response) {
                        // console.log(response)
                        function runInterval() {
                            // console.log(response.body)
                            const id = JSON.parse(response.body).id;
                            var mg1 = JSON.parse(response.body).message;
                            console.log(mg1)
                            if (mg1 == 'symbol does not have a valid value' || !id){
                                res.status(500).send(mg1)
                                clearInterval(this);}
                            queryOrder(id, (resp) => {
                                if (resp.error) {
                                    clearInterval(this);
                                    return res.status(500).send(resp.error)
                                }
                                if (resp.resp) {
                                    // console.log(JSON.parse(resp.resp.body))
                                    var data = JSON.parse(resp.resp.body);
                                    var bal = Math.round(data.executedQty * data.price) - 1;
                                    console.log(bal);
                                    var mg = JSON.parse(resp.resp.body).message;
                                    if (mg == 'orderId is invalid' || mg == 'Too many api request'){
                                        res.status(500).send(mg)
                                        clearInterval(this);}
                                    if (JSON.parse(resp.resp.body).status == 'done') {
                                        clearInterval(this);
                                        var currencies = user.currencies;
                                        var done = false;
                                        for (var i = 0; i < currencies.length; i++) {
                                            if (currencies[i]['currency'] == currency) {
                                                currencies[i]['quantity'] -= new Number(data.executedQty);
                                                currencies[i]['quantity'] = new Number(currencies[i]['quantity']).toFixed(5)
                                                console.log(currencies[i]['quantity']);
                                                done = true;
                                            }
                                        }
                                        console.log(currencies)
                                        User.findByIdAndUpdate(req.user._id, { currencies: currencies, $inc: { balance: bal } }, function (err, docs) {
                                            if (err) {
                                                console.log(err)
                                            }
                                            else {
                                                // console.log("Updated User : ", docs);
                                                return res.status(200).json({'success': 'Sold successfully', currencies: currencies});
                                            }
                                        })
                                    }
                                }
                            })
                        }
                        setInterval(runInterval, 5000);
                    }
                });
            });
        }
    })
})

router.get("/history", auth, async (req, res) => {
    if (!req.user._id)
        return res.status(401).send("User unauthorized")
    Gift.find({ senderId: req.user._id }, { redeemCode: false, _id: false }).then(resp => res.status(200).send(resp))
})

module.exports = router;