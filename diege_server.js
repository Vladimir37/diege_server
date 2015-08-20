var http = require('http');
var express = require('express');
var parser = require('body-parser');
var jade = require('jade');
var mysql = require('mysql');
var fs = require('fs');
var random = require('random-token').create('0987654321');
var cookie = require('cookie-parser');
var Crypt = require('easy-encryption');
var mail = require('./mail');

var db_connect;
fs.readFile('db.json', function(err, resp) {
	if(err) {
		console.log(err);
	}
	else {
		db_connect = mysql.createConnection(JSON.parse(resp));
	}
});

var crypt = new Crypt({
	secret: 'vladimir_parol_37', 
	iterations: 3700
});

var app = express();
app.use(parser());
app.use(cookie());

//Главная
app.get('/', function(req, res) {
	jade.renderFile('pages/index.jade', function(err, resp) {
		res.end(resp);
	});
});

//Проверка логина и пароля
app.post('/login', function(req, res) {
	db_connect.connect(function() {
		db_connect.query('SELECT * FROM `bloggers_main` WHERE `mail` = "' + req.body.login + '" AND `pass` = "' + req.body.pass + '"', function(err, rows) {
			if(rows == '') {
				res.redirect('/login');
			}
			else {
				//Логин дальше
				var log_params;
				if(req.body.remember) {
					log_params = { maxAge: 1209600000 };
				}
				else {
					log_params = null;
				}
				//console.log(req.body.remember);
				var crypt_key = crypt.encrypt(rows[0].key);
				res.cookie('aut.' + rows[0].name + '.diege', crypt_key, log_params);
				res.end('Win!');
			}
		});
	});
});

//Неверный логин или пароль
app.get('/login', function(req, res) {
	jade.renderFile('pages/login.jade', function(err, resp) {
		res.end(resp);
	});
});

//Регистрация
app.post('/sign', function(req, res) {
	var name_re = new RegExp('^[a-zA-Z0-9]+$');

	if(name_re.test(req.body.name)) {
		db_connect.connect(function() {
			db_connect.query('SELECT * FROM `bloggers_main` WHERE `name` = "' + req.body.name + '"', function(err, rows) {
				if(rows == '') {
					db_connect.query('SELECT * FROM `bloggers_main` WHERE `mail` = "' + req.body.mail + '"', function(err, rows) {
						if(rows == '') {
							var key = random(8);
							db_connect.query('SELECT * FROM `bloggers_main` ORDER BY `port` DESC LIMIT 1', function(err, rows) {
								var new_port;
								if(rows == '') {
									new_port = 81;
								}
								else {
									new_port = ++rows[0].port;
								}
								db_connect.query('INSERT INTO `bloggers_main` (`name`, `mail`, `pass`, `port`, `key`) VALUES ("' + req.body.name + '", "' + req.body.mail + '", "' + req.body.pass + '", ' + new_port + ', ' + key + ')', function(err) {
									if(err) {
										console.log(err);
										res.end('Error!');
									}
									else {
										res.end('Win!!');
									}
								});
							})
							
						}
						else {
							res.redirect('/sign');
						}
					});	
				}
				else {
					res.redirect('/sign');
				}
			});
		});
	}
	else {
		res.redirect('/sign');
	}
});

//Отдельная страница с регистрацией
app.get('/sign', function(req, res) {
	jade.renderFile('pages/sign.jade', function(err, resp) {
		res.end(resp);
	});
});

//Проверка занятости имени и почты 
app.post('/name_check', function(req, res) {
	db_connect.connect(function() {
		db_connect.query('SELECT * FROM `bloggers_main` WHERE `name` = "' + req.body.data + '"', function(err, rows) {
			if(rows == '') {
				res.end('free');
			}
			else {
				res.end('Not free')
			}
		});
	});
});
app.post('/mail_check', function(req, res) {
	db_connect.connect(function() {
		db_connect.query('SELECT * FROM `bloggers_main` WHERE `mail` = "' + req.body.data + '"', function(err, rows) {
			if(rows == '') {
				res.end('free');
			}
			else {
				res.end('Not free')
			}
		});
	});
});

//Ресурсы
app.get('/source/*', function(req, res) {
	var addr = req.url.slice(8);
	//console.log(addr);
	fs.readFile('source/' + addr, function(err, resp) {
		if(err) {
			res.end('Error!')
		}
		else {
			res.end(resp);
		}
	});
});

http.createServer(app).listen(80);