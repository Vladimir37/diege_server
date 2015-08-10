var nodemailer = require('nodemailer');
var jade = require('jade');

function confirm(addr, key) {

    var transporter = nodemailer.createTransport({
        service: 'mail.ru',
        auth: {
            user: 'registration@diege.ru',
            pass: 'datadata3'
        }
    });

    var mailOptions = {
        from: 'registration@diege.ru', // sender address
        to: addr, // list of receivers
        subject: 'Регистрация на Diege.ru', // Subject line
        html: '<b>Hello world</b>' // html body
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }
        else{
            console.log('Message sent: ' + info.response);
        }
    });
};

exports.confirm = confirm;