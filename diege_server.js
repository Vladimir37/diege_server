var http = require('http');
var express = require('express');
var parser = require('body-parser');
var jade = require('jade');
var mysql = require('mysql');
var db_connect = mysql.createConnection({
	host     : 'localhost',
  	user     : 'root',
  	password : 'node_db',
  	database : 'diege_main'
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
		db_connect.query('SELECT * FROM `bloggers_main` WHERE `port` = 40', function(err, rows) {
			console.log(err);
			console.log(rows);
			res.end();
		})
	});
});

http.createServer(app).listen(80);