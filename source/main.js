$(document).ready(function() {
	//Исчезновение плейсхолдера
	var placeholder;
	$('input:not([type="submit"])').focus(function() {
		placeholder = $(this).attr('placeholder');
		$(this).attr('placeholder', '');
	});
	$('input:not([type="submit"])').blur(function() {
		$(this).attr('placeholder', placeholder);
	});
	//Проверка свободности имени
	$('input[name="name"]').blur(function() {
		$.post('/name_check', {'data': $('input[name="name"]').val()}, function(data) {
			if(data == 'free') {
				$('.name_check').slideUp();
				if($('.mail_check').is(':hidden')) {
					$('#new_blog').attr('disabled', false);
				}
			}
			else {
				$('.name_check').slideDown();
				$('#new_blog').attr('disabled', 'disabled');
			}
		});
	});
	$('input[name="mail"]').blur(function() {
		$.post('/mail_check', {'data': $('input[name="mail"]').val()}, function(data) {
			if(data == 'free') {
				$('.mail_check').slideUp();
				if($('.name_check').is(':hidden')) {
					$('#new_blog').attr('disabled', false);
				}
			}
			else {
				$('.mail_check').slideDown();
				$('#new_blog').attr('disabled', 'disabled');
			}
		});
	});
	//Неверно заполнена форма
	var ref = window.location.search.slice(1);
	if(ref == 'unlog') {
		$('.unlog').show();
	}
	//Несовпадение новых паролей
	$('input[name="new_pass2"]').blur(function() {
		if($('input[name="new_pass2"]').val() == $('input[name="new_pass"]').val()) {
			$('.unpass').slideUp();
			$('input[type="submit"]').attr('disabled', false);
		}
		else {
			$('.unpass').slideDown();
			$('input[type="submit"]').attr('disabled', true);
		}
	});
});