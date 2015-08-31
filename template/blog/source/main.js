$(document).ready(function() {
	//Конструктор спектров
	function fabrColor(col) {
		this.showPaletteOnly = true,
		this.togglePaletteOnly = false,
		this.togglePaletteMoreText = 'more',
		this.togglePaletteLessText = 'less',
		this.color = col,
		this.palette = [
        ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
        ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
        ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
        ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
        ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
        ["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
        ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
        ["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
    	]
	};

	//Кнопки выбора
	$('.perm').buttonset();
	$('.sub_but').button();
	//Выбор цвета
	var select_color = ['m_tit_color', 's_tit_color', 'rib_font', 'rib_color_f', 'rib_color_s', 'panel_color', 'panel_color_tit', 'panel_color_li', 'back_cont', 'color_main_tit', 'color_main_te', 'but_col', 'but_back'];

	select_color.forEach(function(item) {
		$('#' + item).spectrum(new fabrColor($('#'+item).val()));
	});

	//Выделение пунктов по системным данным из фрейма
	$('#mtp' + $('#sys1').val()).click();
	$('#stp' + $('#sys2').val()).click();
	$('#rs' + $('#sys6').val()).click();
	$('#mp' + $('#sys9').val()).click();
	$('#rs' + $('#sys6').val()).click();
	$('#pp' + $('#sys10').val()).click();
	$('#news' + $('#sys14').val()).click();
	$('#bench' + $('#sys15').val()).click();
	$('#arc' + $('#sys16').val()).click();
	$('#vol' + $('#sys21').val()).click();
	$('#flo' + $('#sys22').val()).click();
	$('#com' + $('#sys23').val()).click();
	$('#he' + $('#sys24').val()).click();
	$('input[id="' + $('#sys30').val() + '"]').click();
	$('#back_type' + $('#sys31').val()).click();

	//Удаление второго цвета
	$('input[name="rib_sort"]').change(function(){
		if($('#rs1').is(':checked')) {
			$("#rib_color_s").next().fadeOut();
		}
		else {
			$("#rib_color_s").next().fadeIn();
		}
	});
	//Управление панелью
	$('input[name="pan_main"]').change(function() {
		if($('#mp1').is(':checked')) {
			$('#pan_cont').slideDown();
		}
		else {
			$('#pan_cont').slideUp();
		}
	});
	//Проверка панели при загрузке
	if($('#mp2').is(':checked')) {
		$('#pan_cont').hide();
	};
	//Управление прозрачностью
	$('#slide_opacity').slider({
		range: "min",
		value: $('#sys18').val()*10,
		min: 5,
		max: 10,
		slide: function( event, ui ) {
			$("#opacity").val(ui.value/10);
		}
	});
	//Постинг картинок
	var j = 1;
	$('.posting input[type="file"]').change(function(qwe) {
		if(!$(this).data('changed')) {
			$('#content_post').val($('#content_post').val() + '[ЗагруженноеИзображение' + j + ']');
			j++;
			$('input[type="file"][name="img' + j + '"]').slideDown();
			$(this).attr('data-changed', true);
			$(this).css('border', '4px solid orange');
		}
	});
	//Очистка поста при обновлении страницы
	$('.posting #content_post').val(null);
	for(var i = 1; i < 3; i++) {
		$('.posting input[name="img' + i + '"]').val('');
	};
	//Отправка поста при клике
	$('.posting #post_submit').click(function() {
		$('#content_post').attr('required', true);
		$('#sub_post_but').click();
	});

	//Сохраненение поста в пул
	$('.posting #save_to_pool').click(function() {
		$('#content_post').attr('required', true);
		$('#to_pool_radio').click();
		$('#sub_post_but').click();
	});


	//При загрузке неверного фона
	var ref = window.location.search.slice(1);
	if(ref == 'unback') {
		$('.wrong_file').show();
	}
	//Отображение панели
	$.ajax('/panel_data', {
		dataType: 'json',
		success: function(data) {
			if(data.news) {
				//Отображение новостей
				$('<article class="pan pan_news"></article>').appendTo('section.panel');
				for(k in data.news_data) {
					$('<a href="/post/' + k.slice(1) + '"><article class="pan_list">' + data.news_data[k] + '</article></a>').appendTo('article.pan_news')
				}
				$('<article class="pan_title">Новое</article>').prependTo('article.pan_news');
			}
			if(data.rubric) {
				//Отображение рубрик
				$('<article class="pan pan_rub"></article>').appendTo('section.panel');
				$('<article class="pan_title">Рубрики</article>').prependTo('article.pan_rub');
				data.rubric_data.forEach(function(item) {
					$('<a href="/rubric/' + item + '"><article class="pan pan_list">' + item + '</article></a>').appendTo('article.pan_rub');
				});
			}
			if(data.archives) {
				//Отображение арихива
				$('<article class="pan pan_arh"></article>').appendTo('section.panel');
				$('<article class="pan_title">Архив</article>').prependTo('article.pan_arh');
				for(k in data.archives_data) {
					$('<a href="/year/' + k + '"><article class="pan pan_list pan_year">' + k + '</article></a>').appendTo('article.pan_arh');
					data.archives_data[k].forEach(function(item) {
						$('<a href="/month/' + item + '"><article class="pan pan_list pan_month">' + month(item) + '</article></a>').appendTo('article.pan_arh');
					});
				}
			}
			//Отображение статей
			if(data.links) {
				for(k in data.links_data) {
					$('<a href="/post/' + data.links_data[k] + '">' + '<nav class="link_art">' + k + '</nav></a>').appendTo('.ribbon');
				};
			}
			//Отображение кнопок
			if(data.admin) {
				$('.button_admin').show();
			}
		}
	});
	//Редактирование постов
	$('#edit_post').click(function() {
		$("article.content_post.data_post").replaceWith(function(){
			$('article.content_post.data_post img').replaceWith('[ЗагруженноеИзображение]');
			var self = this;
			var inner_text = $(this).html();
			for(var i = 1; i < 4; i++) {
				inner_text = inner_text.replace('[ЗагруженноеИзображение]', '[ЗагруженноеИзображение' + i + ']');
			};
			return '<textarea name="main_text" class="content_post data_post" required>' + inner_text + '</textarea>';
		});
		$('section.post_main a').replaceWith(function(){
			return '<input name="rubric" value="' + $('article.rubric_post').html().slice(9) + '" pattern="^[a-zA-Zа-яА-Я0-9\ ]{1,20}$">';
		});
		$('h3.post_tit').replaceWith(function(){
			return '<input name="title" value="' + $(this).html() + '" pattern="^[a-zA-Zа-яА-Я0-9\ \?\!\.]{1,20}$" required><br>';
		});
		$('input[type="submit"], input[type="button"]').slideUp();
		$('<input type="submit" value="Сохранить" class="but_read">').appendTo('section.post_main form');
	});
	//Отключение панели при настройках
	if($('.system').text()) {
		$('.panel').hide();
	};
	//Преобразование месяцев
	function month(name) {
		switch(name) {
			case '01':
				return 'Январь';
				break;
			case '02':
				return 'Февраль';
				break;
			case '03':
				return 'Март';
				break;
			case '04':
				return 'Апрель';
				break;
			case '05':
				return 'Май';
				break;
			case '06':
				return 'Июнь';
				break;
			case '07':
				return 'Июль';
				break;
			case '08':
				return 'Август';
				break;
			case '09':
				return 'Сентябрь';
				break;
			case '10':
				return 'Октябрь';
				break;
			case '11':
				return 'Ноябрь';
				break;
			case '12':
				return 'Декабрь';
				break;
		}
	};
});