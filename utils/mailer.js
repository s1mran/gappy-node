const nodeMailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

async function sendMail(subject, senderUserName, senderUserEmail, receiverUserName, receiverUserEmail, currency, reedemCode) {
    let transporter = nodeMailer.createTransport({
        host: "smtp.zoho.com",
        secure: true,
        port: 465,
        auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    var options = {
        viewEngine: {
            extname: '.handlebars',
            layoutsDir: 'views',
            defaultLayout: 'index'
        },
        viewPath: 'views',
        extName: '.handlebars'
    };

    transporter.use('compile', hbs(options))

    const mailOptions = {
        from: process.env.EMAIL_ADDRESS, // sender address
        to: receiverUserEmail,
        cc: senderUserEmail,
        replyTo: senderUserEmail,
        subject: subject, // Subject line
        template: 'index',
        context: {
            receiverName: receiverUserName,
            senderName: senderUserName,
            code: reedemCode,
            crypto: currency
        },
        attachments: [{
            filename: 'gift-image.png',
            path: __dirname +'/../images/gift-image.png',
            cid: 'gift' 
       }]
    };

    await transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            return err;
        } else {
            return info;
        }
    })
}

function createMailSubject(senderName) {
    var subject = "You've received a Cryft Gift"
    if (senderName) {
        subject += " from " + senderName;
    }
    return subject;
}

module.exports = {
    sendMail,
    createMailSubject
};