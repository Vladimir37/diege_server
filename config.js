var exec = require('child_process').exec;

//Генерация nginx конфига
function config(domain, port) {
	return "server {\n	listen 80;\n\n	server_name " + domain + ".diege.ru;\n	client_max_body_size 512m;\n\n	location / {\n		proxy_pass http://localhost:" + port + ";\n		proxy_http_version 1.1;\n		proxy_set_header Upgrade $http_upgrade;\n		proxy_set_header Connection 'upgrade';\n		proxy_set_header Host $host;\n		proxy_cache_bypass $http_upgrade;\n	}\n}"
};

//Создание баз и запуск клиента
function signUp(rows, res) {
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
							var server_config = config(rows[0].name, rows[0].port);
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
			});
		}
	});
};

//Перезапуск всех блогов
function restart() {
	db_connect.query('SELECT * FROM `bloggers_main` WHERE `confirmed` = 1', function(err, rows) {
		if(err) {
			console.log(err);
		}
		else {
			rows.forEach(function(item) {
				exec('cd /root/blogs/' + item.name + '; forever start app.js', function(err) {
					if(err) {
						console.log(err);
					}
				});
			});
		}
	})
};

exports.generate = config;
exports.signUp = signUp;
exports.restart = restart;