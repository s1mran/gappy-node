let express = require("express");
const router = express.Router();
const crypto = require("crypto");
const request = require('request');
const Gift = require("../../models/Gift");
const User = require("../../models/User");
const auth = require("../../middleware/auth");
const { waitForOrderFulfilled, queryOrder } = require('../../utils/buy-sell')

let companies = [
    {
        "name": "manainr",
        "percent": 30
    },
    {
        "name": "sandinr",
        "percent": 30
    },
    {
        "name": "thetainr",
        "percent": 10
    },
    {
        "name": "axsinr",
        "percent": 10
    },
    {
        "name": "enjinr",
        "percent": 10
    },
    {
        "name": "chrinr",
        "percent": 10
    }
];
router.post("/invest-in-sag", auth, async (req, res) => {
    if (!req.user._id)
        return res.status(401).send("User unauthorized")
    if (!req.user.apiKey || !req.user.apiSecret)
        return res.status(400).send("Invalid api key or secret, please fill the information correctly.")
    var { sag, amount } = req.body;
    var timestamp = new Date().getTime();
    for (var i = 0; i < companies.length; i++) {
        var currency = companies[i].name;
        var money = (amount * companies[i].percent) / 100;
        var priceUrl = 'https://api.wazirx.com/sapi/v1/ticker/24hr?symbol=' + currency;
        request({
            url: priceUrl,
            method: "GET"
        }, function (error, response, body) {
            if (error)
                return res.send(500).send(error);
            var mg2 = JSON.parse(response.body).message;
            if (mg2 == 'symbol does not have a valid value') {
                return res.status(500).send(mg2)
            }
            var lastPrice = JSON.parse(response.body).lastPrice;

            // console.log(response.body)
            var quantity = (money) / (lastPrice);

            var data = 'symbol=' + currency + '&side=buy&price=' + lastPrice + '&type=limit&quantity=' + quantity + '&recvWindow=10000&timestamp=' + timestamp;
            let signature = crypto
                .createHmac("sha256", req.user.apiSecret)
                .update(data)
                .digest("hex");

            console.log(lastPrice)
            console.log(quantity)
            data += '&signature=' + signature;
            request({
                url: "https://api.wazirx.com/sapi/v1/order",
                method: "POST",
                headers: {
                    'x-api-key': req.user.apiKey,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: data
            }, async function (error, response, body) {
                if (error)
                    console.log(res.status(500).send(error));
                if (response) {
                    console.log(response)
                    function runInterval() {
                        // console.log(response.body)
                        const id = JSON.parse(response.body).id;
                        var mg1 = JSON.parse(response.body).message;
                        if (mg1 == 'symbol does not have a valid value' || !id) {
                            res.status(500).send(mg1)
                            clearInterval(this);
                        }
                        queryOrder(id, (resp) => {
                            if (resp.error) {
                                clearInterval(this);
                                return res.status(500).send(resp.error)
                            }
                            if (resp.resp) {
                                console.log(JSON.parse(resp.resp.body))
                                var data = JSON.parse(resp.resp.body);
                                console.log(bal);
                                var mg = JSON.parse(resp.resp.body).message;
                                if (mg == 'orderId is invalid' || mg == 'Too many api request') {
                                    clearInterval(this);
                                    res.status(500).send(mg)
                                }
                                if (data.status == 'done') {
                                    clearInterval(this);
                                    let sags = req.user.sags || [];
                                    let idx = -1;
                                    for (var l = 0; l < sags.length; l++) {
                                        if (sags[l].name == sag) {
                                            idx = l;
                                            let crncis = sags[l].currencies;
                                            for (var k = 0; k < crncis.length; k++) {
                                                if (crncis[k].name == data.symbol)
                                                    crncis[k].quantity += data.executedQty
                                            }
                                            sags[l].currencies = crncis;
                                        }
                                    }
                                    if (!idx) {
                                        let currencies = [];
                                        for (var j = 0; j < companies.length; j++) {
                                            let qty = 0;
                                            if (companies[i].name == data.symbol)
                                                qty = data.executedQty;
                                            currencies.push({
                                                'currency': companies[i].name,
                                                'quantity': qty,
                                                'currencyName': companies[i].name
                                            })
                                        }
                                        sags.push({
                                            'name': sag,
                                            'currencies': currencies
                                        })
                                        idx = 0;
                                    }

                                    User.updateOne({ '_id': req.user._id }, {
                                        sags: sags
                                    }, function (err, docs) {
                                        if (err) {
                                            console.log(err)
                                        }
                                    })

                                }
                            }
                        })
                    }
                    setInterval(runInterval, 20000);
                }
            });
        });
    }
})

router.post('/connect-exchange', auth, (req, res) => {
    if (!req.user._id)
        return res.status(401).send("User unauthorized")
    let {
        apiKey, secretKey, exchange
    } = req.body;
    if (!apiKey || !secretKey || !exchange) {
       return  res.status(400).send("Invalid input");
    }
    const userId = req.user._id;
    var changed = false;
    User.findById(userId).then(user => {
        let exchanges = user.exchanges || [];
        for (var i = 0; i < exchanges.length; i++) {
            if (exchanges[i].exchange == req.body.exchange) {
                exchanges[i] = req.body;
                changed = true;
                break;
            }
        }
        if (!changed)
            exchanges.push(req.body);
        User.updateOne({ _id: userId }, { exchanges: [ ...exchanges ] }, function (err, info) {
            if (err)
               return res.status(500).send(err);
            if (info) {
                res.status(200).json({success: "Connected with exchange succesfully!"});
            }
        });
    })
})

module.exports = router;
