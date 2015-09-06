var fs = require('fs');
var jade = require('jade');
var mysql = require('mysql');
var Crypt = require('easy-encryption');

var time = require('./time');
var connect = require('./disconnect');

//Данные расшифровки куков
var crypt = new Crypt({
	secret: 'key', 
	iterations: 3700
});

//Чтение спецификации
var specific;
fs.readFile('blog/specification.json', function(err, resp) {
	if(err) {
		console.log(err);
	}
	else {
		specific = JSON.parse(resp);
	}
});

//Контроль авторизации
function auth_control(cookie) {
	if(cookie) {
		var key = crypt.decrypt(cookie);
		if(key == specific.key) {
			return true;
		}
		else {
			return false;
		}
	}
	else {
		return false;
	}
};

//Рендеринг jade
function renderJade(res, name, addon, extra, extra2, extra3) {
	fs.readFile('blog/blogger.json', function(err, data) {
	if(err) {
		console.log(err);
	}
	else {
		frame = JSON.parse(data);
		var blog_name = specific.name.slice(0, 1).toUpperCase() + specific.name.slice(1);
		frame.blog_name = blog_name;
		frame.added = addon;
		frame.extra = extra;
		frame.extra2 = extra2;
		frame.extra3 = extra3;
		jade.renderFile('blog/pages/' + name + '.jade', frame, function(error, resp) {
			if(err) {
				console.log(error);
			}
			else {
				res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'})
				res.end(resp);
			}
		});
	}
	});
};

//Рендеринг ресурсов
function renderRes(res, name) {
	fs.readFile(name, function(err, resp) {
		if(err) {
			console.log(err);
		}
		else {
			res.charset = 'utf-8';
			res.end(resp);
		}
	});
};

//Рендер настроек
function setting(res) {
	fs.readFile('blog/blogger.json', function(err, data) {
		if(err) {
			console.log(err);
		}
		else {
			frame = JSON.parse(data);
			res.writeHead(200, {'Content-Type': 'text/css'});
			res.write('h1 {text-align: ' + align(frame.head.one_or) + '; color: ' + frame.head.one_col + ';}\n');
			res.write('h2 {text-align: ' + align(frame.head.two_or) + '; color: ' + frame.head.two_col + ';}\n');
			res.write('.ribbon {background: ' + ribbon_color(frame.top_panel.back_type, frame.top_panel.back_color_f, frame.top_panel.back_color_s) + '; color: ' + frame.top_panel.color + '; height: ' + frame.top_panel.height * 50 + 'px;}\n');
			res.write('.but_adm {background: ' + ribbon_color(frame.top_panel.back_type, frame.top_panel.back_color_f, frame.top_panel.back_color_s) + '; color: ' + frame.top_panel.color + ';}\n');
			res.write('nav {line-height: ' + frame.top_panel.height * 50 + 'px;}\n');
			res.write('.panel {color: ' + frame.main_panel.color + '}\n');
			res.write('.pan_title {background: ' + frame.main_panel.back_title + '}\n');
			res.write('.pan_list {background: ' + frame.main_panel.back_main + '}\n');
			res.write('.post_tit {color: ' + frame.content.title_color + '}\n');
			res.write('.data_post {color: ' + frame.content.font_color + '}\n');
			res.write('.back { background-image: url("/source/back-blog/' + frame.content.background + '"); ');
			if(frame.content.back_type == 1) {
				res.write('background-size: cover; }\n');
			}
			else {
				res.write('background-repeat: repeat; }\n');
			}
			res.write('.main_field {background: ' + frame.content.back_color + ';');
			res.write('opacity: ' + frame.content.opacity + ';}');
			res.write('.but_read { background: ' + frame.button.background + '; color: ' + frame.button.color + '; ');
			if(frame.button.volime == 1) {
				res.write('box-shadow: inset -6px -6px 5px 2px black; box-shadow: inset 6px 6px 5px 2px white; ');
			}
			if(frame.button.flow == 1) {
				res.write('border-radius: 15px;');
			}
			res.write('}\n')
			if(frame.main_panel.position == 1) {
				res.write('.content {float: right;} .panel {float: left;}\n.button_admin {right: 0;}\n');
			}
			else {
				res.write('.content {float: left;} .panel {float: right;}');
			}
			if(frame.main_panel.enabled == 1) {
				res.write('.content {width: 615px;} .panel {width: 300px;}');
			}
			else {
				res.write('.content {width: 100%;}');
			}
			res.end();
		}
	});
};

//Расшифровка значений
function align(num) {
	switch(num) {
		case '1':
			return 'left'
			break;
		case '2':
			return 'center'
			break;
		case '3':
			return 'right'
			break;
		default:
			return 'left'
			break;
	}
};
//Определение цвета ленты
function ribbon_color(type, col_1, col_2) {
	if(type == 1) {
		return col_1;
	}
	else if(type == 2) {
		return 'linear-gradient(to bottom, ' + col_1 + ', ' + col_2 + ')';
	}
	else {
		return 'linear-gradient(to bottom, ' + col_1 + ', ' + col_2 + ', ' + col_1 + ')'
	}
};

//Рендер поста
function renderPost(res, num, status, login) {
	db_connect.query('SELECT * FROM ' + specific.name + '_post WHERE `id` = ' + num + ' AND `pool` = 0', function(err, rows) {
		if(err) {
			console.log(err);
		}
		else if(rows == '') {
			res.redirect('/error');
		}
		else {
			//Проверка на авторизацию в системе
			var login_name;
			if(login['aut.diege']) {
				for(k in login) {
					if(k != 'aut.diege') {
						login_name = k.slice(4, -6);
						break;
					}
				}
			}
			//Конец проверки
			var time_post = time.conversion(rows[0].date);
			var img_arr;
			if(rows[0].imgs) {
				img_arr = rows[0].imgs.split('|');
			}
			else {
				img_arr = [];
			}
			for(var i = 0; i <= img_arr.length; i++) {
				var i_cur = i + 1;
				rows[0].text = rows[0].text.replace('[ЗагруженноеИзображение' + i_cur + ']', '<img src="/source/images/' + num + '/' + img_arr[i] + '" alt="img">');
			}
			if(rows[0].comment != 0) {
				db_connect.query('SELECT * FROM ' + specific.name + '_comment WHERE `article` = ' + num, function(err, rows_com) {
					rows_com.forEach(function(item) {
						item.date = time.conversion(item.date);
					});
					if(status == 1) {
						renderJade(res, 'post', rows[0], time_post, rows_com, login_name);
					}
					else {
						renderJade(res, 'post_user', rows[0], time_post, rows_com, login_name);
					}
				});
			}
			else {
				if(status == 1) {
					renderJade(res, 'post', rows[0], time_post, null, login_name);
				}
				else {
					renderJade(res, 'post_user', rows[0], time_post, null, login_name);
				}
			}
		}
	});
};

//Рендер поста из пула
function renderPostPool(res, num) {
	db_connect.query('SELECT * FROM ' + specific.name + '_post WHERE `id` = ' + num + ' AND `pool` = 1', function(err, rows) {
		if(err) {
			console.log(err);
		}
		else if(rows == '') {
			res.redirect('/error');
		}
		else {
			var time_post = time.conversion(rows[0].date);
			var img_arr;
			if(rows[0].imgs) {
				img_arr = rows[0].imgs.split('|');
			}
			else {
				img_arr = [];
			}
			for(var i = 0; i <= img_arr.length; i++) {
				var i_cur = i + 1;
				rows[0].text = rows[0].text.replace('[ЗагруженноеИзображение' + i_cur + ']', '<img src="/source/images/' + num + '/' + img_arr[i] + '" alt="img">');
			}
			if(rows[0].comment != 0) {
				db_connect.query('SELECT * FROM ' + specific.name + '_comment WHERE `article` = ' + num, function(err, rows_com) {
					rows_com.forEach(function(item) {
						item.date = time.conversion(item.date);
					});
					renderJade(res, 'post_pool', rows[0], time_post, rows_com);
				});
			}
			else {
				renderJade(res, 'post_pool', rows[0], time_post);
			}
		}
	});
};

//Рендер списка постов
function list(res, type, num, obj) {
	if(type == 1) {
		db_connect.query('SELECT * FROM ' + specific.name + '_post WHERE `pool` = 0 ORDER BY `date` DESC', function(err, rows) {
			if(err) {
				console.log(err);
			}
			else {
				var cols = Math.ceil(rows.length / 10) - 1;
				var need_rows = rows.slice(num*10, num*10+10);
				if(need_rows == '') {
					//Нет постов
					renderJade(res, 'new_blog');
				}
				else {
					handlingList(res, need_rows, cols, num, '/index/');
				}
			}
		})
	}
	else if(type == 2) {
		db_connect.query('SELECT * FROM ' + specific.name + '_post WHERE `rubric` = "' + obj + '" AND `pool` = 0 ORDER BY `date` DESC', function(err, rows) {
			if(err) {
				console.log(err);
			}
			else {
				var cols = Math.ceil(rows.length / 10) - 1;
				var need_rows = rows.slice(num*10, num*10+10);
				if(need_rows == '') {
					res.redirect('/error')
				}
				else {
					handlingList(res, need_rows, cols, num, '/rubric/' + obj + '/');
				}
			}
		})
	}
	else if(type == 3) {
		db_connect.query('SELECT * FROM ' + specific.name + '_post WHERE `pool` = 0 ORDER BY `date` DESC', function(err, all_rows) {
			if(err) {
				console.log(err);
			}
			else {
				var rows = [];
				all_rows.forEach(function(item) {
					var date_arr = time.conversion_arr(item.date);
					if(date_arr[2] == obj) {
						rows.push(item);
					}
				});
				var cols = Math.ceil(rows.length / 10) - 1;
				var need_rows = rows.slice(num*10, num*10+10);
				if(need_rows == '') {
					res.redirect('/error')
				}
				else {
					handlingList(res, need_rows, cols, num, '/year/' + obj + '/');
				}
			}
		});
	}
	else if(type == 4) {
		db_connect.query('SELECT * FROM ' + specific.name + '_post WHERE `pool` = 0 ORDER BY `date` DESC', function(err, all_rows) {
			if(err) {
				console.log(err);
			}
			else {
				var rows = [];
				all_rows.forEach(function(item) {
					var date_arr = time.conversion_arr(item.date);
					if(date_arr[1] == obj) {
						rows.push(item);
					}
				});
				var cols = Math.ceil(rows.length / 10) - 1;
				var need_rows = rows.slice(num*10, num*10+10);
				if(need_rows == '') {
					res.redirect('/error')
				}
				else {
					handlingList(res, need_rows, cols, num, '/month/' + obj + '/');
				}
			}
		});
	}
	else if(type == 5) {
		db_connect.query('SELECT * FROM ' + specific.name + '_post WHERE `pool` = 1 ORDER BY `date` DESC', function(err, rows) {
			if(err) {
				console.log(err);
			}
			else {
				var cols = Math.ceil(rows.length / 10) - 1;
				var need_rows = rows.slice(num*10, num*10+10);
				if(need_rows == '') {
					res.redirect('/error')
				}
				else {
					handlingList(res, need_rows, cols, num, '/pool/', true);
				}
			}
		});
	}
};

//Обработка и рендер списка постов
function handlingList(res, rows, cols, num, type, pool) {
	rows.forEach(function(item) {
		if(item.text.length > 512) {
			item.text = item.text.slice(0, 512) + '...';
		}
		item.date = time.conversion(item.date);
		var img_arr;
		if(item.imgs) {
			img_arr = item.imgs.split('|');
		}
		else {
			img_arr = [];
		}
		for(var i = 0; i <= img_arr.length; i++) {
			var i_cur = i + 1;
			item.text = item.text.replace('[ЗагруженноеИзображение' + i_cur + ']', '<img src="/source/images/' + item.id + '/' + img_arr[i] + '" alt="img">');
		}
	});
	var pages = [num, cols];
	if(pool) {
		renderJade(res, 'index_pool', rows, pages, type);
	}
	else {
		renderJade(res, 'index', rows, pages, type);
	}
};

//Рендер JSON объекта с данными о панели
function panel(res, cookie) {
	fs.readFile('blog/blogger.json', function(err, data) {
		if(err) {
			console.log(err);
		}
		else {
			var panel_data = {};
			frame = JSON.parse(data);
			var readiness = 0;
			if(frame.main_panel.enabled == 1) {
				//Основное
				res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
				if(frame.main_panel.news == 2) {
					db_connect.query('SELECT * FROM ' + specific.name + '_post WHERE `pool` = 0 ORDER BY `date` DESC LIMIT 10', function(err, rows) {
						if(err) {
							console.log(err);
						}
						else {
							panel_data.news = true;
							panel_data.news_data = {};
							rows.forEach(function(item) {
								panel_data.news_data['s' + item.id] = item.name;
							});
							readiness++;
							checkPanel(res, readiness, panel_data);
						}
					})
				}
				else {
					readiness++;
					checkPanel(res, readiness, panel_data);
				}
				if(frame.main_panel.brenchs == 2) {
					db_connect.query('SELECT DISTINCT `rubric` FROM ' + specific.name + '_post', function(err, rows) {
						if(err) {
							console.log(err);
						}
						else {
							panel_data.rubric = true;
							panel_data.rubric_data = [];
							rows.forEach(function(item) {
								panel_data.rubric_data.push(item.rubric);
							});
							readiness++;
							checkPanel(res, readiness, panel_data);
						}
					});
				}
				else {
					readiness++;
					checkPanel(res, readiness, panel_data);
				}
				if(frame.main_panel.archives == 2) {
					db_connect.query('SELECT * FROM ' + specific.name + '_post WHERE `pool` = 0 ORDER BY `date` DESC', function(err, rows) {
						panel_data.archives = true;
						panel_data.archives_data = {};
						rows.forEach(function(item) {
							var date_res = time.conversion_arr(item.date);
							panel_data.archives_data[date_res[2]] = [];
						});
						rows.forEach(function(item) {
							var date_res = time.conversion_arr(item.date);
							panel_data.archives_data[date_res[2]].push(date_res[1]);
						});
						for(k in panel_data.archives_data) {
							panel_data.archives_data[k] = unique(panel_data.archives_data[k]);
						}
						readiness++;
						checkPanel(res, readiness, panel_data);
					});
				}
				else {
					readiness++;
					checkPanel(res, readiness, panel_data);
				}
				//Рендер ссылок на статьи в ленте
				if(Object.keys(frame.top_panel.articles) != '') {
					panel_data.links = true;
					panel_data.links_data = frame.top_panel.articles;
					readiness++;
					checkPanel(res, readiness, panel_data);
				}
				else {
					readiness++;
					checkPanel(res, readiness, panel_data);
				}
				//Кнопки контроля
				if(cookie) {
					panel_data.admin = true;
					readiness++;
					checkPanel(res, readiness, panel_data);
				}
				else {
					readiness++;
					checkPanel(res, readiness, panel_data);
				}
			}
			else {
				//Панель отключена
				readiness = 3;
				if(Object.keys(frame.top_panel.articles) != '') {
					panel_data.links = true;
					panel_data.links_data = frame.top_panel.articles;
					readiness++;
					checkPanel(res, readiness, panel_data);
				}
				else {
					readiness++;
					checkPanel(res, readiness, panel_data);
				}
				//Кнопки контроля
				if(cookie) {
					panel_data.admin = true;
					readiness++;
					checkPanel(res, readiness, panel_data);
				}
				else {
					readiness++;
					checkPanel(res, readiness, panel_data);
				}
			}
		}
	});
};

//Рендер ссылок
function links_render(res) {
	fs.readFile('blog/blogger.json', function(err, data) {
		if(err) {
			console.log(err);
		}
		else {
			frame = JSON.parse(data);
		}
	});
	db_connect.query('SELECT * FROM ' + specific.name + '_post WHERE `pool` = 0 ORDER BY `date` DESC', function(err, rows) {
		if(err) {
			console.log(err);
		}
		else {
			var all_posts = {};
			rows.forEach(function(item) {
				all_posts[item.id] = item.id + '. ' + item.name;
			});
			renderJade(res, 'links', all_posts);
		}
	});
};

//Только уникальные элементы массива
function unique(arr) {
	var obj = {};
	for (var i = 0; i < arr.length; i++) {
		var str = arr[i];
		obj[str] = true; // запомнить строку в виде свойства объекта
	}
	return Object.keys(obj);
};

//Проверка завершения формирования JSONа панели
function checkPanel(res, num, obj) {
	if(num == 5) {
		var panel_result = JSON.stringify(obj);
		res.end(panel_result);
	}
};

exports.jade = renderJade;
exports.source = renderRes;
exports.setting = setting;
exports.post = renderPost;
exports.pool_post = renderPostPool;
exports.list = list;
exports.panel = panel;
exports.links = links_render;
exports.auth_control = auth_control;