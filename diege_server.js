var http = require('http');
var express = require('express');
var parser = require('body-parser');
var jade = require('jade');
var mysql = require('mysql');
var fs = require('fs');
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

var app = express();
app.use(parser());

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
				res.end('Win')//Логин дальше
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