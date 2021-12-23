const nodeMailer = require('nodemailer');

async function sendMail (subject, message, senderUser, receiver) {
    let transporter = nodeMailer.createTransport({
        host: "smtp.zoho.com",
        secure: true,
        port: 465,
        auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
    
    const mailOptions = {
        from: process.env.EMAIL_ADDRESS, // sender address
        to: receiver,
        cc: senderUser,
        replyTo: [senderUser, process.env.EMAIL_ADDRESS],
        subject: subject, // Subject line
        html: message, // plain text body
    };
    
    await transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            return err;
        } else {
            return info;
        }
    })
}

function createMailBody (receiver, sender, currency, reedemCode) {
    if (!receiver) {
        receiver = "";
    }
    if (!sender) {
        sender = "";
    }

    var body = '<!DOCTYPE html><html><head><title>Font Awesome Icons</title><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.5.0/css/all.css" integrity="sha384-B4dIYHKNBt8Bc12p+WXckhzcICo0wtJAoU8YZTY5qE0Id1GSseTk6S+L3BlXeVIU" crossorigin="anonymous"></head><body><div><h1>C R Y F T</h1>';
    body += receiver.length ? "<p>Hello " + receiver + ",</p>" : "Hello,</p>";


    body += '</div></body></html>'
    return "";
}

function createMailSubject (sender) {
    var subject = "You've received a Cryft Gift"
    if (receiver) {
        subject += " from " + receiver;
    }
    return subject;
}

module.exports = {
    sendMail,
    createMailBody
};