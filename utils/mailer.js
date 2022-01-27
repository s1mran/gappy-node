const nodeMailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

async function sendGiftMail(subject, senderUserName, senderUserEmail, receiverUserName, receiverUserEmail, currency, reedemCode) {
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
            path: __dirname + '/../images/gift-image.png',
            cid: 'gift'
        }]
    };
    return await sendMail(mailOptions, 'index');
}

async function sendForgetPassMail(receiverUserEmail, resetLink) {
    const mailOptions = {
        from: process.env.EMAIL_ADDRESS, // sender address
        to: receiverUserEmail,
        subject: 'Gappy password reset', // Subject line
        template: 'forget-pass',
        context: {
            resetLink: resetLink
        }
    };
    return await sendMail(mailOptions, 'forget-pass');
}

async function sendBalanceMail(name, id, amount, bankDetails) {
    console.log(bankDetails);
    const {
        ifscCode,
        address,
        branch,
        bankName,
        accountNumber,
        accountHolderName,
        city
    } = bankDetails;
    console.log({
        username: name,
        userId: id,
        withdrawn: amount,
        ifscCode: ifscCode,
        address: address,
        branch: branch,
        bankName: bankName,
        accountNumber: accountNumber,
        accountHolderName: accountHolderName,
        city: city
    })
    const mailOptions = {
        from: process.env.EMAIL_ADDRESS, // sender address
        to: "rainav277@gmail.com",
        subject: 'Gappy balance payout', // Subject line
        template: 'withdrawn',
        context: {
            username: name,
            userId: id,
            withdrawn: amount,
            ifscCode: ifscCode,
            address: address,
            branch: branch,
            bankName: bankName,
            accountNumber: accountNumber,
            accountHolderName: accountHolderName,
            city: city
        }
    };
    return await sendMail(mailOptions, 'withdrawn');
}

async function sendMail(mailOptions, template) {
    let transporter = nodeMailer.createTransport({
        host: "smtp.zoho.in",
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
            defaultLayout: template
        },
        viewPath: 'views',
        extName: '.handlebars'
    };

    transporter.use('compile', hbs(options))
    await transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err)
            return err;
        } else {
            console.log(info)
            return info;
        }
    })
}

function createMailSubject(senderName) {
    var subject = "You've received a Gappy Gift"
    if (senderName) {
        subject += " from " + senderName;
    }
    return subject;
}

module.exports = {
    sendGiftMail,
    sendForgetPassMail,
    createMailSubject,
    sendBalanceMail
};