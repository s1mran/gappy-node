const request = require('request');
const crypto = require("crypto");

var apiKey = process.env.WZRX_API_KEY;
var secretKey = process.env.WZRX_SECRET_KEY;

async function queryOrder (orderId, callback) {
    var timestamp = new Date().getTime();
    var data = 'orderId=' + orderId + '&timestamp=' + timestamp;
    let signature = crypto
        .createHmac("sha256", secretKey)
        .update(data)
        .digest("hex");
    data += '&signature=' + signature;
    request({
        url: "https://api.wazirx.com/sapi/v1/order?" + data,
        method: "GET",
        headers: {
            'x-api-key': apiKey
        },
    }, function (error, response, body) {
        if (error)
            callback({'error': error});
        if (response)
            callback({'resp': response});
    });
}

module.exports = {
    queryOrder
}