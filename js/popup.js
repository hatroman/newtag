//ползунок масштаба изображения в окне редактирование изображения
function SliderSw(input_name) {
	var SliderClass = ".slider";
	$(SliderClass).slider({
		range: 'min',
		value:100,
		min: 1,
		max: 100,
		stop: function(event, ui) {
			$(input_name).val($(SliderClass).slider('values',1));
			$('.ui-slider-handle').html('<span>'+$(SliderClass).slider('values',1)+'%</span>');
		},
		slide: function(event, ui) {
			$(input_name).val($(SliderClass).slider('values',1));
			$('.ui-slider-handle').html('<span>'+$(SliderClass).slider('values',1)+'%</span>');
		}
	});
}
//высота окна 
function screenHeight(){
	return $.browser.opera? window.innerHeight : $(window).height();
}
//ширина окна
function screenWidth(){
	return $.browser.opera? window.innerWidth : $(window).width();
}
//величина скролла
function getBodyScrollTop(){
	return self.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || (document.body && document.body.scrollTop);
}
//закрыть всплывающее окно
function popupClose(selector) {
	var WindowCarrierO = ".overlay-cont";
	if (selector) { $(selector).closest(WindowCarrierO).remove(); }
	else { $(WindowCarrierO).remove(); }
	WindowHeight();
}
function WindowHeight() {
//Пересчет высоты (если блок выезжает за зону сайта)
	var GeneralWindowClass = ".overlay-cont";
	$(GeneralWindowClass)
		.css("height","auto")
		.height( $(document).height() )
	;
}
//открыть всплывающее окно
function popupOpen(param) {
	var BodyO = "body";
	var w = $(BodyO).width();
	var WaitCursorClass = "wait-cursor";
	//Тут можно шаблонизировать каркас окна
	var WindowO = '<div class="overlay-cont new-overlay-cont"><div class="overlay"></div><div class="popup"><div class="popup-content"></div></div></div>';
	var WindowCloseO = '<a class="close-link" href="javascript:void(0);">X</a>';
	//--
	var WindowCarrierO = ".new-overlay-cont";
	var NewWindowClass = "new-overlay-cont";
	var PopupContent = ".popup-content";
	var WindowBackgroundO = ".overlay";
	var WindowBlockO = ".popup";
	var CloseO = ".close-link, .big-btn-close-link";
	//Добавляем класс
	$(BodyO).addClass(WaitCursorClass);
	//Добавляем тело Окна
	$(BodyO).append(WindowO);
	//Выставляем ширину затемняющего слоя
	WindowHeight();
	//Центрирование по вертикали
	var ScrollTop= getBodyScrollTop() + 100;
	$(WindowBlockO).css({ top : ScrollTop+"px" });
	//Присваиваем ширину окна
	if( param.w ) {
		$(WindowCarrierO + " " + WindowBlockO).width(param.w);
	} else {
		w = parseInt(w/2);
		if ( w < 300 ) { w = 300; }
		$(WindowCarrierO + " " + WindowBlockO).width(w);
	}
	//Загружаем контент
	if(param.url){
		if ( param.url.indexOf('#') == 0 ) {
		} else {
			$(WindowCarrierO + " " + PopupContent).load( param.url, function() {
				//Используем параметры
				if ( param.addClass ) { $(this).addClass(param.addClass); }
				if ( param.slider ) { SliderSw(param.slider); }
				if ( param.SetClick ) { SetClick(param.SetClick); }
				if ( param.placeholder ) { $(this).find(".js-placeholder").placeholder(); }
				//Удаляем ожидающий класс
				$(BodyO).removeClass(WaitCursorClass);
				//Загружаем код окна в тело окна
				$(WindowCarrierO + " " + WindowBlockO).append(WindowCloseO);
				//Закрываем окно по клику на закрыть
				$(WindowCarrierO + " " + WindowBlockO).find(CloseO).click( function() {
					popupClose($(this));
					return false;
				});
				//Закрываем окно по клику на затемняющий фон
				$(WindowCarrierO + " " + WindowBackgroundO).click( function() {
					popupClose($(this));
				});
				//
				WindowHeight();
				//Завершаем работу с новым окном (строчка всегда должна стоять в конце)
				$(BodyO).find(WindowCarrierO).removeClass(NewWindowClass);
				param.callback && param.callback.apply();
			})
			.attr('data-block_id', param.block_id || ''); // связь с блоком, если указано
		}
	}
}