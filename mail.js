var nodemailer = require('nodemailer');
var jade = require('jade');
var fs = require('fs');

var transporter = nodemailer.createTransport({
	service: 'mail.ru',
	auth: {
		user: 'registration@diege.ru',
		pass: 'datadata3'
	}
});

function confirm(addr, letter, key) {
	var mailOptions = {};
    key_obj = {};
    key_obj.key = key;
	jade.renderFile('pages/mails/' + letter, key_obj, function(err, resp) {
		if(err) {
			console.log(err);
		}
		else {
			mailOptions = {
				from: 'registration@diege.ru', // sender address
				to: addr, // list of receivers
				subject: 'Регистрация на Diege.ru', // Subject line
				html: resp // html body
			};
			send(mailOptions);
		}
	});
	
};

//Отправка
function send(option) {
	transporter.sendMail(option, function(error, info){
		if(error){
			console.log(error);
		}
		else{
			console.log('Message sent: ' + info.response);
		}
	});
}

exports.confirm = confirm;