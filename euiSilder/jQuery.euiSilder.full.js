/**
 * euiSilder Plugin
 */
!function (window) {
    "use strict";

    function Silder(element, options) {
        this.$element = $(element);
        this.options = $.extend({}, Silder.DEFAULTS, options || {});
        this.init();
        this.transitioning = false; // 标识动画是否正在运行
    }

    // 150ms 为切换动画执行时间
    Silder.TRANSITION_DURATION = 150;

    Silder.DEFAULTS = {
        onstatechange: function() {}
        ,isRange: false
        ,showLabels: true
        ,showScale: true
        ,showInput: false
        ,step: 1
        ,format: '%s'
        ,theme: 'theme-green'
        ,width: 300
        ,disable: false
        ,timeline :false
    };
    Silder.TEMPLATE = '<div class="slider-container">\
        <div class="back-bar">\
            <div class="selected-bar"></div>\
            <div class="pointer low"></div><div class="pointer-label">123456</div>\
            <div class="pointer high"></div>\
            <div class="tyue-numbox-wrap">\
            <div class="tyue-numbox-con pointer-label"></div>\
            <div class="tyue-tips-arrow"><span class="tyue-arrow-border"></span></div></div>\
            <div class="clickable-dummy"></div>\
        </div>\
        <div class="scale"></div>\
        <div class="tyue-input-number tyue-input-bar-right" style="display:none">\
            <div class="tyue-input-number-input-wrap">\
            <input step="1" min="1" max="10" class="tyue-input-number-input" autocomplete="off" value=""></div></div>\
    </div>';

    // 缓存原型
    Silder.pt = Silder.prototype;

    /**
     * dom 初始化
     */
    Silder.pt.init = function() {
        var _this = this;

        _this.inputNode     = _this.$element;
        _this.options.value         = _this.inputNode.val() || (_this.options.isRange ? _this.options.from + ',' + _this.options.from : _this.options.from);
        _this.domNode       = $(Silder.TEMPLATE);
        _this.domNode.addClass(_this.options.theme);
        _this.inputNode.after(_this.domNode);
        _this.domNode.on('change', _this.onChange);

        _this.pointers      = $('.pointer', _this.domNode);
        _this.lowPointer    = _this.pointers.first();
        _this.highPointer   = _this.pointers.last();
        _this.labels        = $('.pointer-label', _this.domNode);
        _this.lowLabel      = _this.labels.first();
        _this.highLabel     = _this.labels.last();
        _this.scale         = $('.scale', _this.domNode);
        _this.bar           = $('.selected-bar', _this.domNode);
        _this.clickableBar  = _this.domNode.find('.clickable-dummy');
        _this.interval      = _this.options.to - _this.options.from;
        _this.wrapnum       = $(".tyue-numbox-wrap", _this.domNode);
        _this.inputBarInut  = $(".tyue-input-bar-right", _this.domNode);
        _this.inputNumber   = _this.inputBarInut.find(".tyue-input-number-input");
        _this.movestart     = null;
        _this.render();

    };

    /**
     * 渲染到页面
     */
    Silder.pt.render = function() {
        var _this = this;

        // 检测inputNode是否可见以及容器是否设置宽度，以便设置宽度
        if (_this.inputNode.width() === 0 && !_this.options.width) {
            console.log('euiSilder : 没有设置宽度');
            return;
        } else {
            _this.domNode.width(_this.options.width || _this.inputNode.width());
            _this.inputNode.hide();
        }

        if (_this.isSingle()) {
            _this.lowPointer.hide();
            _this.lowLabel.hide();
        }
        if (!_this.options.showLabels) {
            _this.labels.hide();
        }
        if(_this.options.timeline){
            for(var i=0;i<_this.options.scale.length;i++){  
                if(_this.options.scale[i] < 1 ){
                    _this.options.scale[i] = _this.options.scale[i] * 60 +"分钟";
                }
                if(_this.options.scale[i] >= 1 && _this.options.scale[i] < 24){
                    _this.options.scale[i] = _this.options.scale[i]  +"小时";
                }
                if(_this.options.scale[i] >= 24 && _this.options.scale[i] < 720 ){
                    _this.options.scale[i] = _this.options.scale[i] / 24 + "天";
                }
                if(_this.options.scale[i] >= 720 ){
                    _this.options.scale[i] = _this.options.scale[i] / ( 24 * 30 ) + "月";
                }
            }
        }
        _this.attachEvents();
        _this.circleMove();
        _this.setValue(_this.options.value);
        if (_this.options.showScale) {
            _this.renderScale();
        }
        if(_this.options.showInput){
            _this.inputBarInut.show();
            // _this.onInputBar();
        }
    };

    /**
     * 
     */
    Silder.pt.circleMove = function(){
        var _this = this;
        this.highPointer.bind('mousemove mousedown mouseenter', function(event) {
            _this.wrapnum[0].style.display = "block";
            $(".back-bar").css("opacity",1);
        });
        this.highPointer.bind('mouseleave', function(event) {
            _this.wrapnum[0].style.display = "none";
            $(".back-bar").css("opacity","0.75");
        });
    };

    /**
     * 
     */
    Silder.pt.onInputBar = function(){
        var _this = this;

        var value = _this.highLabel.text();
        _this.inputBarInut.numberInput({
            min: _this.options.from, //最小值
            max: _this.options.to,  //最大值
            step: 1, //每次改变步数
            defaultValue:value, //初始值
            callback:function(obj){
                _this.setValue(obj);
            }
        });
    };

    /**
     * 
     */
    Silder.pt.isSingle = function() {
        var _this = this;

        if (typeof(_this.options.value) === 'number') {
            return true;
        }
        return (_this.options.value.indexOf(',') !== -1 || _this.options.isRange) ?
            false : true;
    };

    /**
     * 
     */
    Silder.pt.attachEvents = function() {
        var _this = this;

        _this.clickableBar.click($.proxy(this.barClicked, this));
        _this.pointers.on('mousedown touchstart', $.proxy(_this.onDragStart, this));
        _this.pointers.bind('dragstart', function(event) {
            event.preventDefault();
        });
    };

    /**
     * 
     */
    Silder.pt.onDragStart = function(e) {
        var _this = this;

        if ( _this.options.disable || (e.type === 'mousedown' && e.which !== 1)) {
            return;
        }
        e.stopPropagation();
        e.preventDefault();
        var pointer = $(e.target);
        _this.pointers.removeClass('last-active');
        pointer.addClass('focused last-active');
        _this[(pointer.hasClass('low') ? 'low' : 'high') + 'Label'].addClass('focused');
        $(document).on('mousemove.slider touchmove.slider', $.proxy(_this.onDrag, this, pointer));
        $(document).on('mouseup.slider touchend.slider touchcancel.slider', $.proxy(_this.onDragEnd, this));
        _this.movestart = e.clientX;
    };

    /**
     * 
     */
    Silder.pt.onDrag = function(pointer, e) {
        var _this = this;

        e.stopPropagation();
        e.preventDefault();

        if (e.originalEvent.touches && e.originalEvent.touches.length) {
            e = e.originalEvent.touches[0];
        } else if (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
            e = e.originalEvent.changedTouches[0];
        }

        var position = e.clientX - _this.domNode.offset().left;
        _this.domNode.trigger('change', [this, pointer, position]);
        if(this.options.timeline){

            if(e.clientX > this.movestart){
                position = e.clientX - _this.domNode.offset().left + 30;
            }else{
                position = e.clientX - _this.domNode.offset().left - 30;
            }
            _this.domNode.trigger('change', [this, pointer, position]);
        }
    };

    /**
     * 
     */
    Silder.pt.onDragEnd = function(e) {
        var _this = this;

        _this.pointers.removeClass('focused');
        _this.labels.removeClass('focused');
        $(document).off('.slider');
    };

    /**
     * 
     */
    Silder.pt.barClicked = function(e) {
        var _this = this;

        if(_this.options.disable) return;
        var x = e.pageX - _this.clickableBar.offset().left;
        if (_this.isSingle())
            _this.setPosition(_this.pointers.last(), x, true, true);
        else {
            var pointer = Math.abs(parseInt(_this.pointers.first().css('left'), 10) - x + _this.pointers.first().width() / 2) < Math.abs(parseInt(_this.pointers.last().css('left'), 10) - x + _this.pointers.first().width() / 2) ?
                _this.pointers.first() : _this.pointers.last();
            _this.setPosition(pointer, x, true, true);
        }
    };

    /**
     * 
     */
    Silder.pt.onChange = function(e, self, pointer, position) {
        var min, max;
        if (self.isSingle()) {
            min = 0;
            max = self.domNode.width();
        } else {
            min = pointer.hasClass('high') ? self.lowPointer.position().left + self.lowPointer.width() / 2 : 0;
            max = pointer.hasClass('low') ? self.highPointer.position().left + self.highPointer.width() / 2 : self.domNode.width();
        }
        var value = Math.min(Math.max(position, min), max);
        self.setPosition(pointer, value, true);
    };

    /**
     * 
     */
    Silder.pt.setPosition = function(pointer, position, isPx, animate) {
        var _this = this;

        var leftPos,
            lowPos = _this.lowPointer.position().left,
            highPos = _this.highPointer.position().left,
            circleWidth = _this.highPointer.width() / 2;
        if (!isPx) {
            position = _this.prcToPx(position);
        }
        if (pointer[0] === _this.highPointer[0]) {
            highPos = Math.round(position - circleWidth);
        } else {
            lowPos = Math.round(position - circleWidth);
        }
        pointer[animate ? 'animate' : 'css']({
            'left': Math.round(position - circleWidth)
        });
        if (_this.isSingle()) {
            leftPos = 0;
        } else {
            leftPos = lowPos + circleWidth;
        }
        _this.bar[animate ? 'animate' : 'css']({
            'width': Math.round(highPos + circleWidth - leftPos),
            'left': leftPos
        });
        _this.showPointerValue(pointer, position, animate);
        _this.isReadonly();
    };

    /**
     * 
     */
    // will be called from outside
    Silder.pt.setValue = function(value) {
        var _this = this;

        var values = value.toString().split(',');
        _this.options.value = value;
        var prc = _this.valuesToPrc(values.length === 2 ? values : [0, values[0]]);
        if (_this.isSingle()) {
            _this.setPosition(_this.highPointer, prc[1]);
        } else {
            _this.setPosition(_this.lowPointer, prc[0]);
            _this.setPosition(_this.highPointer, prc[1]);
        }
    };

    /**
     * 
     */
    Silder.pt.renderScale = function() {
        var _this = this;

        var s = _this.options.scale || [_this.options.from, _this.options.to];
        var prc = Math.round((100 / (s.length - 1)) * 10) / 10;
        var str = '';
        for (var i = 0; i < s.length; i++) {
            str += '<span style="left: ' + i * prc + '%">' + (s[i] != '|' ? '<ins>' + s[i] + '</ins>' : '') + '</span>';
        }
        _this.scale.html(str);

        $('ins', _this.scale).each(function() {
            $(this).css({
                marginLeft: -$(this).outerWidth() / 2
            });
        });
    };

    /**
     * 
     */
    Silder.pt.getBarWidth = function() {
        var _this = this;

        var values = _this.options.value.split(',');
        if (values.length > 1) {
            return parseInt(values[1], 10) - parseInt(values[0], 10);
        } else {
            return parseInt(values[0], 10);
        }
    };

    /**
     * 
     */
    Silder.pt.showPointerValue = function(pointer, position, animate) {
        var _this = this;

        var label = $('.pointer-label', _this.domNode)[pointer.hasClass('low') ? 'first' : 'last']();
        var text;
        var value = _this.positionToValue(position);
        _this.inputNumber.val(value);
        if ($.isFunction(_this.options.format)) {
            var type = _this.isSingle() ? undefined : (pointer.hasClass('low') ? 'low' : 'high');
            text = _this.options.format(value, type);
        } else {
            text = _this.options.format.replace('%s', value);
        }

        var width = label.html(text).width(),
            left = position - width / 2;
        left = Math.min(Math.max(left, -22), this.options.width );
        this.wrapnum[animate ? 'animate' : 'css']({
            left: left
        });
        _this.setInputValue(pointer, value);
    };

    /**
     * 
     */
    Silder.pt.valuesToPrc = function(values) {
        var lowPrc = ((values[0] - this.options.from) * 100 / this.interval),
            highPrc = ((values[1] - this.options.from) * 100 / this.interval);
        return [lowPrc, highPrc];
    };

    /**
     * 
     */
    Silder.pt.prcToPx = function(prc) {
        return (this.domNode.width() * prc) / 100;
    };

    /**
     * 
     */
    Silder.pt.positionToValue = function(pos) {
        var _this = this;

        var value = (pos / _this.domNode.width()) * _this.interval;
        value = value + _this.options.from;
        return Math.round(value / _this.options.step) * _this.options.step;
    };

    /**
     * 
     */
    Silder.pt.setInputValue = function(pointer, v) {
        var _this = this;

        // if(!isChanged) return;
        if (_this.isSingle()) {
            _this.options.value = v.toString();
        } else {
            var values = _this.options.value.split(',');
            if (pointer.hasClass('low')) {
                _this.options.value = v + ',' + values[1];
            } else {
                _this.options.value = values[0] + ',' + v;
            }
        }
        if (_this.inputNode.val() !== _this.options.value) {
            _this.inputNode.val(_this.options.value);
            _this.options.onstatechange.call(this, _this.options.value);
        }
    };

    /**
     * 
     */
    Silder.pt.getValue = function() {
        return this.options.value;
    };

    /**
     * 
     */
    Silder.pt.isReadonly = function(){
        var _this = this;

        _this.domNode.toggleClass('slider-readonly', _this.options.disable);
    };

    /**
     * 
     */
    Silder.pt.disable = function(){
        var _this = this;

        _this.options.disable = true;
        _this.isReadonly();
    };

    /**
     * 
     */
    Silder.pt.enable = function(){
        var _this = this;

        _this.options.disable = false;
        _this.isReadonly(); 
    };

    /**
     * 
     */
    Silder.pt.toggleDisable = function(){
        var _this = this;

        _this.options.disable = !_this.options.disable;
        _this.isReadonly();
    }


    /**
     * 给选项卡导航绑定点击事件
     */
    Silder.pt.bindEvent = function() {
        var _this = this;
        _this.$nav.each(function (e) {
            $(this).on('click.eui.tabs', function () {
                _this.open($(this).index());
            });
        });
        _this.$delete.each(function(e){
            $(this).on('click.eui.tabs', function () {
                _this.delete($(this.parentNode).index());
            });
        });
    };

    /**
     * 打开选项卡
     * @param index 当前导航索引
     */
    Silder.pt.open = function(index) {
        var _this = this;

        index = typeof index == 'number' ? index : _this.$nav.filter(index).index();

        var $curNav = _this.$nav.eq(index);

        // 如果切换动画进行时或者当前二次点击 禁止重复操作
        if (_this.transitioning || $curNav.hasClass(_this.options.activeClass))return;

        _this.transitioning = true;

        // 打开选项卡时绑定自定义事件
        $curNav.trigger($.Event('open.eui.tabs', {
            index: index
        }));

        // 给tab导航添加选中样式
        _this.active($curNav, _this.$nav);

        // 给tab内容添加选中样式
        _this.active(_this.$panel.eq(index), _this.$panel, function () {
            // 打开选项卡后绑定自定义事件
            $curNav.trigger({
                type: 'opened.eui.tabs',
                index: index
            });
            _this.transitioning = false;
        });
    };

    /**
     * 删除选项卡
     * @param index 当前导航索引
     */
    Silder.pt.delete = function(index) {
        var _this = this,
            length = _this.$nav.length;

        index = typeof index == 'number' ? index : _this.$nav.filter(index).index();

        // 待删项
        var $deleteNav = _this.$nav.eq(index),
            $deletePanel = _this.$panel.eq(index);

        $deleteNav.remove();
        _this.$nav = _this.$element.find(_this.options.nav);
        _this.$delete = _this.$element.find(_this.options.delete);
        $deletePanel.remove();
        _this.$panel = _this.$element.find(_this.options.panel);

        // 待激活项
        var curIndex = index+1 == length? index-1 : index;
        _this.open(curIndex);
    }

    /**
     * 添加选中样式
     * @param $element 当前需要添加选中样式的对象
     * @param $container 当前对象的同级所有对象
     * @param callback 回调
     */
    Silder.pt.active = function($element, $container, callback) {
        var _this = this,
            activeClass = _this.options.activeClass;

        var $active = $container.filter('.' + activeClass);

        function next () {
            typeof callback == 'function' && callback();
        }

        // 动画执行完毕后回调
        $element.one('webkitTransitionEnd', next).emulateTransitionEnd(Tabs.TRANSITION_DURATION);

        $active.removeClass(activeClass);
        $element.addClass(activeClass);
    };

    // 组件入口1
    function euiSilder(option) {
        var args = Array.prototype.slice.call(arguments, 1);

        return this.each(function () {
            var target = this,
                $this = $(target),
                data = $this.data('euiSilder');

            if (!data) {
                $this.data('euiSilder', (data = new Silder(target, option)));

                $(window).resize(function() {
                    data.setValue(data.getValue());
                });
            }

            if (typeof option == 'string') {
                data[option] && data[option].apply(data, args);
            }
        });
    }

    // 组件入口2
    $(window).on('load.eui.tabs', function () {
        $('[data-eui-tabs]').each(function () {
            var $this = $(this);
            $this.euiSilder(window.EUI.util.parseOptions($this.data('eui-tabs')));
        });
    });

    $.fn.euiSilder = euiSilder;

}(window);