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

app.get('/', function(req, res) {
	jade.renderFile('pages/index.jade', function(err, resp) {
		res.end(resp);
	});
});

app.post('/login', function(req, res) {
	db_connect.connect(function() {
		db_connect.query('SELECT * FROM `bloggers_main` WHERE `mail` = "' + req.body.login + '" AND `pass` = "' + req.body.pass + '"', function(err, rows) {
			if(rows == '') {
				res.end('Fail');
			}
			else {
				res.end('Win')
			}
		});
	});
});

//Ресурсы
app.get('/source/*', function(req, res) {
	var addr = req.url.slice(8);
	console.log(addr);
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