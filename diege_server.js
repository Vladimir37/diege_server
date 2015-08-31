var http = require('http');
var express = require('express');
var parser = require('body-parser');
var jade = require('jade');
var mysql = require('mysql');
var fs = require('fs');
var ncp = require('ncp');
var random = require('random-token').create('0987654321');
var cookie = require('cookie-parser');
var Crypt = require('easy-encryption');
var favicon = require('serve-favicon');
var exec = require('child_process').exec;

var mail = require('./mail');
var connect = require('./disconnect');
var config = require('./config');

//Регэкспы
var re_num = new RegExp('^[0-9]{1,}$');
var re_mail = new RegExp('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$');
var re_name = new RegExp('^[a-zA-Z0-9]{1,20}$');
var re_pass = new RegExp('^[а-яА-Яa-zA-Z0-9\+\-\_\!\&\?\%\@\ё\Ё]{1,}$');

//Подключение к базе
fs.readFile('db.json', function(err, resp) {
	if(err) {
		console.log(err);
	}
	else {
		var db_data = JSON.parse(resp);
		connect.activate(db_data);
	}
});
Object.defineProperty(global, 'db_connect', {
	get: function() {
		return connect.connection();
	},
	set: function(value) {}
});

//Данные зашифровки
var crypt = new Crypt({
	secret: 'vladimir_parol_37', 
	iterations: 3700
});

var app = express();
app.use(parser());
app.use(cookie());
app.use(favicon('source/img/favicon.ico'));

//Главная
app.get('/', function(req, res) {
	render(res, 'index');
});

//Тест
app.get('/te', function(req, res) {
	// ncp('pages', 'source/qwe', function(err) {
	// 	console.log(err);
	// })
	// exec('cd /home/vladimir/diege_blog; node app.js', function(err) {
	// 	console.log(err);
	// });
	res.end();
})

//Проверка логина и пароля
app.post('/login', function(req, res) {
	db_connect.query('SELECT * FROM `bloggers_main` WHERE `mail` = "' + req.body.login + '" AND `pass` = "' + req.body.pass + '"', function(err, rows) {
		if(rows == '') {
			res.redirect('/login?unlog');
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
			var crypt_key = crypt.encrypt(rows[0].key);
			res.cookie('aut.' + rows[0].name + '.diege', crypt_key, log_params);
			res.cookie('aut.diege', true, log_params);
			res.redirect('http://' + rows[0].name + '.diege.ru');
		}
	});
});

//Страница логина
app.get('/login', function(req, res) {
	render(res, 'login');
});

//Регистрация
app.post('/sign', function(req, res) {
	var name_re = new RegExp('^[a-zA-Z0-9]+$');

	if(name_re.test(req.body.name) && re_pass.test(req.body.pass)) {
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
									res.redirect('/sign?unlog');
								}
								else {
									var key_crypt = crypt.encrypt(key);
									mail.confirm(req.body.mail, 'registr.jade', 'Регистрация на Diege.ru', key_crypt);
									render(res, 'mail');
								}
							});
						})				
					}
					else {
						res.redirect('/sign?unlog');
					}
				});	
			}
			else {
				res.redirect('/sign?unlog');
			}
		});
	}
	else {
		res.redirect('/sign?unlog');
	}
});

//Подтверждение почты
app.get('/confirm/:name', function(req, res) {
	var enter_key = req.params.name;
	var true_key = crypt.decrypt(enter_key);
	if(re_num.test(true_key)) {
		db_connect.query('SELECT * FROM `bloggers_main` WHERE `confirmed` = 0 AND `key` = ' + true_key, function(err, rows) {
			if(err || rows == '') {
				console.log(err);
				res.redirect('/error');
			}
			else {
				var new_key = random(8);
				db_connect.query('UPDATE `bloggers_main` SET `confirmed`= 1, `key`=' + new_key + ' WHERE `id`= ' + rows[0].id, function(err) {
					if(err) {
						console.log(err);
					}
					else {
						//Копирование клиента
						ncp('template', '/root/blogs/' + rows[0].name, function(err) {
							if(err) {
								console.log(err);
							}
							else {
								//Создание спецификации
								var specification = {};
								specification.name = rows[0].name;
								specification.key = new_key;
								specification.port = rows[0].port;
								var specific = JSON.stringify(specification);
								//Запись спецификации
								fs.open('/root/blogs/' + rows[0].name + '/blog/specification.json', 'w', function(err, desc) {
									if(err) {
										console.log(err);
									}
									else {
										fs.write(desc, specific, function(err) {
											if(err) {
												console.log(err);
											}
											else {
												//Создание баз
												db_connect.query('CREATE TABLE `' + rows[0].name + '_post` (`id` int(11) NOT NULL AUTO_INCREMENT,`name` text NOT NULL,`text` longtext NOT NULL,`date` text NOT NULL,`imgs` text,`rubric` text,`comment` int(11) NOT NULL DEFAULT "0",`pool` int(11) NOT NULL DEFAULT "0",PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8', function(err) {
													if(err) {
														console.log(err);
													}
													else {
														db_connect.query('CREATE TABLE `' + rows[0].name + '_comment` (`id` int(11) NOT NULL AUTO_INCREMENT,`article` int(11) NOT NULL,`text` longtext NOT NULL,`author_blog` int(11) NOT NULL,`autor_name` varchar(45) DEFAULT NULL,`date` int(11) DEFAULT NULL,PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8', function(err) {
															if(err) {
																console.log(err);
															}
															else {
																//Создание nginx конфига
																fs.open('/etc/nginx/conf.d/' + rows[0].name + '.conf', 'w', function(err, desc) {
																	if(err) {
																		console.log(err);
																	}
																	else {
																		var server_config = config.generate(rows[0].name, rows[0].port);
																		fs.write(desc, server_config, function(err) {
																			if(err) {
																				console.log(err);
																			}
																			else {
																				//Запуск блога
																				exec('cd /root/blogs/' + rows[0].name + '; forever start app.js', function(err) {
																					if(err) {
																						console.log(err);
																					}
																					else {
																						exec('nginx -s reload', function(err) {
																							if(err) {
																								console.log(err);
																							}
																							else {
																								render(res, 'confirm');
																							}
																						});
																					}
																				});
																			}
																		});
																	}
																});
															}
														})
													}
												})
											}
										});
									}
								});
							}
						});
					}
				});
			}
		});
	}
	else {
		res.redirect('/error');
	}
});

//Отдельная страница с регистрацией
app.get('/sign', function(req, res) {
	render(res, 'sign');
});

//Проверка занятости имени и почты 
app.post('/name_check', function(req, res) {
	if(re_name.test(req.body.data)) {
		db_connect.query('SELECT * FROM `bloggers_main` WHERE `name` = "' + req.body.data + '"', function(err, rows) {
			if(rows == '') {
				res.end('free');
			}
			else {
				res.end('Not free')
			}
		});
	}
	else {
		res.end('Not free')
	}
});
app.post('/mail_check', function(req, res) {
	if(re_mail.test(req.body.data)) {
		db_connect.query('SELECT * FROM `bloggers_main` WHERE `mail` = "' + req.body.data + '"', function(err, rows) {
			if(rows == '') {
				res.end('free');
			}
			else {
				res.end('Not free')
			}
		});
	}
	else {
		res.end('Not free')
	}
});

//Помощь
app.get('/help', function(req, res) {
	render(res, 'help');
});
app.get('/help/:name', function(req, res) {
	var name = req.params.name;
	render(res, 'help/' + name);
});

//Договор
app.get('/agreement', function(req, res) {
	render(res, 'agreement');
});

//Обращение в поддержку
app.get('/support', function(req, res) {
	render(res, 'support');
});
app.post('/support', function(req, res) {
	if(req.body.mail && req.body.text) {
		var quest = {};
		quest.text = req.body.text;
		quest.mail = req.body.mail;
		mail.confirm('vladimir_zapas@mail.ru', 'support.jade', 'Обращение в поддержку', quest);
		render(res, 'support_win');
	}
	else {
		res.redirect('/support?unlog')
	}
});

//Восстановление доступа
app.get('/restoring', function(req, res) {
	render(res, 'restoring');
});
app.post('/restoring', function(req, res) {
	if(re_mail.test(req.body.mail)) {
		db_connect.query('SELECT * FROM `bloggers_main` WHERE `mail` = "' + req.body.mail + '"', function(err, rows) {
			if(err || rows == '') {
				console.log(err);
				res.redirect('/restoring?unlog');
			}
			else {
				var data = {};
				data.log = rows[0].mail;
				data.pass = rows[0].pass;
				mail.confirm(rows[0].mail, 'restoring.jade', 'Восстановление доступа', data);
				render(res, 'restoring_win');
			}
		})
	}
	else {
		res.redirect('/restoring?unlog');
	}
});

//Изменение пароля
app.get('/pass_change', function(req, res) {
	render(res, 'pass');
});
app.post('/pass_change', function(req, res) {
	if(re_mail.test(req.body.mail) && re_pass.test(req.body.old_pass) && re_pass.test(req.body.new_pass) && req.body.new_pass == req.body.new_pass2) {
		db_connect.query('SELECT * FROM `bloggers_main` WHERE `mail` = "' + req.body.mail + '" AND `pass` = "' + req.body.old_pass + '"', function(err, rows) {
			if(err || rows == '') {
				console.log(err);
				res.redirect('/pass_change?unlog');
			}
			else {
				db_connect.query('UPDATE `bloggers_main` SET `pass`="' + req.body.new_pass + '" WHERE `mail`="' + req.body.mail + '"', function(err) {
					if(err) {
						console.log(err);
						res.redirect('/pass_change?unlog');
					}
					else {
						var data = {};
						data.log = req.body.mail;
						data.pass = req.body.new_pass;
						mail.confirm(req.body.mail, 'pass.jade', 'Изменение пароля', data);
						render(res, 'pass_win');
					}
				});
			}
		});
	}
	else {
		res.redirect('/pass_change?unlog');
	}
});

//Ресурсы
app.get('/source/*', function(req, res) {
	var addr = req.url.slice(1);
	fs.readFile(addr, function(err, resp) {
		if(err) {
			res.redirect('/error');
		}
		else {
			res.end(resp);
		}
	});
});

//Ошибка
app.get('*', function(req, res) {
	render(res, 'error');
});

//Рендер нефрита
function render(res, page, obj) {
	jade.renderFile('pages/' + page + '.jade', obj, function(err, resp) {
		if(err) {
			console.log(err);
			render(res, 'error');
		}
		else {
			res.end(resp)
		}
	});
};

http.createServer(app).listen(80);