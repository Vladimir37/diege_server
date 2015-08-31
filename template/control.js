var fs = require('fs');
var formidable = require('formidable');
var mysql = require('mysql');

var time = require('./time');
var connect = require('./disconnect');

var re_num = new RegExp(/^[0-9]{1,}$/);
var re_space = new RegExp(/^[\ ]{1,}$/);

//Имя и порт
var specific;
fs.readFile('blog/specification.json', function(err, resp) {
	if(err) {
		console.log(err);
	}
	else {
		specific = JSON.parse(resp);
	}
});

//Обработка изменений в настройках
function editing(changed, res) {
	fs.readFile('blog/blogger.json', function(err, data) {
		frame = JSON.parse(data);
		frame.head.one = changed.main_tit;
		frame.head.two = changed.sec_tit;
		frame.head.one_or = changed.m_tit_pos;
		frame.head.two_or = changed.s_tit_pos;
		frame.head.one_col = changed.m_tit_color;
		frame.head.two_col = changed.s_tit_color;
		frame.top_panel.color = changed.rib_font;
		frame.top_panel.back_type = changed.rib_sort;
		frame.top_panel.back_color_f = changed.f_rib_color;
		frame.top_panel.back_color_s = changed.s_rib_color;
		frame.top_panel.height = changed.rib_he;
		frame.main_panel.enabled = changed.pan_main;
		frame.main_panel.position = changed.pan_pos;
		frame.main_panel.color = changed.panel_color;
		frame.main_panel.back_title = changed.panel_color_tit;
		frame.main_panel.back_main = changed.panel_color_li;
		frame.main_panel.news = changed.news;
		frame.main_panel.brenchs = changed.bench;
		frame.main_panel.archives = changed.arc;
		frame.content.back_color = changed.back_cont;
		frame.content.font_color = changed.color_main_te;
		frame.content.title_color = changed.color_main_tit;
		frame.content.opacity = changed.opacity;
		frame.main.comments = changed.com;
		frame.button.background = changed.but_back;
		frame.button.color = changed.but_col;
		frame.button.volime = changed.vol;
		frame.button.flow = changed.flo;
		editFrame(res, frame, '');
	});
}

function editingBack(changed, res) {
	fs.readFile('blog/blogger.json', function(err, data) {
		frame = JSON.parse(data);
		frame.content.background = changed.pic;
		frame.content.back_type = changed.back_type;
		editFrame(res, frame, '');
	});
};

function createBack(req, res) {
	fs.readFile('blog/blogger.json', function(err, data) {
		frame = JSON.parse(data);
		frame.main.max_back++;
		var form = new formidable.IncomingForm();
		form.uploadDir = 'blog/temp/';
		form.parse(req, function(errors, fields, files) {
			console.log(files.back);
			if(files.back.type.slice(0,6) == 'image/'){
				fs.rename(files.back.path, 'blog/source/back-blog/' + frame.main.max_back, function() {
					editFrame(res, frame, '');
				});
			}
			else {
				res.redirect('/background?unback');
			}
		});
	});
};

//Создание нового поста
function add_post(req, res) {
	var form = new formidable.IncomingForm();
	form.uploadDir = 'blog/temp/';
	var img_num = 0;
	form.parse(req, function(errors, fields, files) {
		var normal_imgs_path = [];
		var normal_imgs_name = [];
		for(k in files) {
			if(files[k].type.slice(0, 6) == 'image/') {
				normal_imgs_path.push(files[k].path);
				normal_imgs_name.push(files[k].name);
				img_num++;
			}
		};
		if(!fields.rubric || re_space.test(fields.rubric)) {
			var rubric = 'Без рубрики';
		}
		else {
			var rubric = safetyText(fields.rubric);
		}
		var title = safetyText(fields.title);
		var content = safetyText(fields.content);
		var curTime = time.current();
		var pool = fields.pool;
		//Если есть изображения к посту
		if(img_num != 0) {
			db_connect.query('SELECT * FROM ' + specific.name + '_post ORDER BY `id` DESC LIMIT 1', function(err, rows) {
				if(err) {
					console.log(err);
				}
				else {
					var id_post;
					if(rows == '') {
						db_connect.query('SHOW TABLE STATUS FROM `diege_main` WHERE `Name` = "' + specific.name + '_post"', function(err, rows_ai) {
							if(err) {
								console.log(err);
							}
							else {
								id_post = rows_ai[0].Auto_increment;
								createImgFolder();
							}
						});
					}
					else {
						id_post = ++rows[0].id;
						createImgFolder();
					}
					function createImgFolder() {
						fs.mkdir('blog/source/images/' + id_post, function(err) {
							if(err) {
								console.log(err);
							}
							else {
								for(var i = 0; i < normal_imgs_name.length; i++) {
									fs.rename(normal_imgs_path[i], 'blog/source/images/' + id_post + '/' + normal_imgs_name[i]);
								}
								db_connect.query('INSERT INTO `' + specific.name + '_post` (`name`, `text`, `date`, `imgs`, `rubric`, `pool`) VALUES ("' + title + '", "' + content + '", "' + curTime + '", "' + normal_imgs_name.join('|') + '", "' + rubric + '", ' + pool + ')', function(err) {
									if(err) {
										console.log(err);
									}
									else {
										res.redirect('/');
									}
								});
							}
						});
					};
				}
			})
		}
		//Если пост без изображений
		else {
			db_connect.query('INSERT INTO `' + specific.name + '_post` (`name`, `text`, `date`, `imgs`, `rubric`, `pool`) VALUES ("' + title + '", "' + content + '", "' + curTime + '", ' + null + ', "' + rubric + '", ' + pool + ')', function(err) {
				if(err) {
					console.log(err);
				}
				else {
					res.redirect('/');
				}
			});
		}
	});
};

//Добавление комментария
function add_comment(req, res, num, login) {
	if(!req.body.comment || re_space.test(req.body.comment)) {
		res.redirect('/error');
	}
	else {
		var content = safetyText(req.body.comment);
		var author_type;
		var author;
		if(req.body.author) {
			for(k in login) {
				if(k != 'aut.diege') {
					author = k.slice(4, -6);
					break;
				}
			}
			author_type = 1;
		}
		else if(req.body.name == '' || re_space.test(req.body.name) || req.body.name.length > 20) {
			author = 'Аноним';
			author_type = 0;
		}
		else {
			author = safetyText(req.body.name);
			author_type = 0;
		}
		var curTime = time.current();
		db_connect.query('INSERT INTO `' + specific.name + '_comment` (`article`, `text`, `author_blog`, `autor_name`, `date`) VALUES (' + num + ', "' + content + '", ' + author_type + ', "' + author + '", ' + curTime + ')', function(err) {
			if(err) {
				console.log(err);
			}
			else {
				db_connect.query('UPDATE `' + specific.name + '_post` SET `comment`= `comment` + 1 WHERE `id`= ' + num, function(err) {
					if(err) {
						console.log(err);
					}
					else {
						res.redirect('/post/' + num);
					}
				})
			}
		})
	}
};

//Операции с пулом
function pool(res, num, type) {
	if(type == 1) {
		db_connect.query('UPDATE `' + specific.name + '_post` SET `date`="' + time.current() + '", `pool`= "0" WHERE `id`=' + num, function(err) {
			if(err) {
				console.log(err);
			}
			else {
				res.redirect('/');
			}
		});
	}
	else if(type == 2) {
		db_connect.query('DELETE FROM `' + specific.name + '_post` WHERE `id`=' + num, function(err) {
			if(err) {
				console.log(err);
			}
			else {
				res.redirect('/pool');
			}
		});
	}
};

//Операции со ссылками
function link(res, data) {
	if(data.type == 1 && data.target) {
		var frame;
		fs.readFile('blog/blogger.json', function(err, result) {
			frame = JSON.parse(result);
			delete frame.top_panel.articles[data.target];
			editFrame(res, frame, 'links');
		});
	}
	else if(data.type == 2 && data.name && data.post) {
		var frame;
		fs.readFile('blog/blogger.json', function(err, result) {
			frame = JSON.parse(result);
			frame.top_panel.articles[data.name] = data.post;
			editFrame(res, frame, 'links');
		});
	}
	else {
		res.redirect('/error');
	}
};

//Редактирование поста
function editingPost(res, data, num) {
	if(data.type == 1) {
		//Редактирование
		var text = safetyText(data.main_text);
		var rubric = safetyText(data.rubric) || 'Без рубрики';
		var title = safetyText(data.title);
		db_connect.query('UPDATE `' + specific.name + '_post` SET `name` = "' + title + '", `text`="' + text + '", `rubric`="' + rubric + '" WHERE `id`=' + num, function(err) {
			if(err) {
				console.log(err);
			}
			res.redirect('/post/' + num);
		});
	}
	else if(data.type == 2) {
		//Удаление
		db_connect.query('DELETE FROM `' + specific.name + '_post` WHERE `id` = ' + num, function(err) {
			if(err) {
				console.log(err);
			}
			res.redirect('/');
		});
	}
	else if(data.type == 3) {
		//Удаление комментария
		if(re_num.test(data.numb)) {
			db_connect.query('DELETE FROM `' + specific.name + '_comment` WHERE `id` = ' + data.numb, function(err) {
				if(err) {
					console.log(err);
				}
				else {
					db_connect.query('UPDATE `' + specific.name + '_post` SET `comment` = `comment` - 1 WHERE `id`=' + num, function(err) {
						if(err) {
							console.log(err);
						}
						res.redirect('/post/' + num);
					});
				}
			});
		}
		else {
			res.redirect('/error');
		}
	}
	else {
		res.redirect('/error');
	}
};

//Безопастность текста
function safetyText(text) {
	var res = text.replace(/\;/g, '&#59;');
	res = res.replace(/\'/g, '&apos;');
	res = res.replace(/\"/g, '&quot;');
	res = res.replace(/\</g, '&lt;');
	res = res.replace(/\>/g, '&gt;');
	res = res.replace(/\(/g, '&#040;');
	res = res.replace(/\)/g, '&#041;');
	return res;
};

//Замена blogger.json
function editFrame(res, obj, next) {
	var result = JSON.stringify(obj);
	fs.open('blog/blogger.json', 'w', function(err, desc) {
		if(err) {
			console.log(err);
		}
		else {
			fs.write(desc, result, function(err) {
				if(err) {
					console.log(err);
				}
				else {
					res.redirect('/' + next);
				}
			});
		}
	});
};

exports.editing = editing;
exports.editingBack = editingBack;
exports.createBack = createBack;
exports.add_post = add_post;
exports.add_comment = add_comment;
exports.pool = pool;
exports.link = link;
exports.postEdit = editingPost;