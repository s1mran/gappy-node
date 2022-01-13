let express = require("express");
const request = require('request');
const router = express.Router();
const User = require("../../models/User");
const auth = require("../../middleware/auth");

router.get("/ifsc/:code", auth, async (req, res) => {
    if (!req.user._id)
        res.status(401).send("User unauthorized")
    var code = req.params.code;
    if (!code)
        res.status(400).send('Invalid ifsc code')
    request({
        url: "https://ifsc.razorpay.com/" + code,
        method: "GET"
    }, function (error, response, body) {
        if (error)
            res.status(400).send(error);
        if (response)
            res.status(200).send(response);
    });
})

router.get("/ticker/:symbol", auth, (req, res) => {
    if (!req.user._id)
        res.status(401).send("User unauthorized")
    var symbol = req.params.symbol;
    if (!symbol)
        res.status(400).send('Invalid currency symbol')
    request({
        url: "https://api.wazirx.com/sapi/v1/ticker/24hr?symbol=" + symbol,
        method: "GET"
    }, function (error, response, body) {
        if (error)
            res.status(400).send(error);
        if (response)
            res.status(200).send(response);
    });
})

module.exports = router;