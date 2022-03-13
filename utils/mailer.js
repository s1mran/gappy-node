const nodeMailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

async function sendGiftMail(subject, senderUserEmail, receiverUserEmail, currency, reedemCode) {
    const mailOptions = {
        from: 'Gappy <' + process.env.EMAIL_ADDRESS + '>', // sender address
        to: receiverUserEmail,
        cc: senderUserEmail,
        replyTo: senderUserEmail,
        subject: subject, // Subject line
        template: 'mail',
        context: {
            code: reedemCode
        },
        attachments: [
            {
                filename: currency + '.jpg',
                path: __dirname + '/../images/' + currency + '.jpg',
                cid: 'gift'
            },
            {
                filename:'1.png',
                path: __dirname + '/../images/' +'1.png',
                cid: '1'
            },
            {
                filename:'2.png',
                path: __dirname + '/../images/' +'2.png',
                cid: '2'
            },
            {
                filename:'3.png',
                path: __dirname + '/../images/' +'3.png',
                cid: '3'
            },
            {
                filename:'4.png',
                path: __dirname + '/../images/' +'4.png',
                cid: '4'
            },
            {
                filename:'5.png',
                path: __dirname + '/../images/' +'5.png',
                cid: '5'
            }
        ]
    };
    return await sendMail(mailOptions, 'mail');
}

async function sendForgetPassMail(receiverUserEmail, resetLink) {
    const mailOptions = {
        from: process.env.EMAIL_ADDRESS, // sender address
        to: receiverUserEmail,
        subject: 'Kilope password reset', // Subject line
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
    const mailOptions = {
        from: process.env.EMAIL_ADDRESS, // sender address
        to: "rainav277@gmail.com",
        subject: 'Kilope balance payout', // Subject line
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
    var subject = "You've received a Kilope Gift"
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