/**
 * @jQuery.euiSilder.js
 * @author rockyxia
 * @version v0.1.0
 * Created: 18-07-01
 */
!function (window) {
    "use strict";

    function Silder(element, options) {
        this.$element = $(element);
        this.options = $.extend({}, Silder.DEFAULTS, options || {});
        this.init();
    }

    Silder.DEFAULTS = {
        isRange: false     // 是否取范围
        ,showLabels: true   // 是否显示指针数值
        ,showScale: true    // 是否显示分段值
        ,showInput: false   // 是否显示输入框
        ,step: 1            // 一次跳动的数值
        ,format: '%s'       // 数值格式化显示
        ,theme: 'theme-default'// 风格样式
        ,width: 300         // 组件整体宽度
        ,disable: false     // 是否可以拖拽
        ,from: 0            // 起始值
        ,to: 100            // 终止值
        ,scale: [0,25,50,75,100] // 分段数值
    };
    Silder.TEMPLATE = '<div class="euislider-container">\
        <div class="euislider-runway">\
            <div class="selected-bar"></div>\
            <div class="pointer low"></div>\
            <div class="pointer high"></div>\
            <div class="numbox-wrap">\
                <div class="numbox-con pointer-label"></div>\
                <div class="tips-arrow"><span class="arrow-border"></span></div>\
            </div>\
        </div>\
        <div class="scale"></div>\
        <div class="input-number input-bar-right" style="display:none">\
            <input step="1" min="1" max="10" class="input-number-input" autocomplete="off" value=""></div>\
    </div>';

    // 缓存原型
    Silder.pt = Silder.prototype;

    /**
     * dom 初始化
     */
    Silder.pt.init = function() {
        var _this = this;

        _this.$inputNode     = _this.$element;
        _this.options.value = _this.$inputNode.val() || (_this.options.isRange ? _this.options.from + ',' + _this.options.from : _this.options.from);
        _this.$domNode       = $(Silder.TEMPLATE);
        _this.$domNode.addClass(_this.options.theme);
        _this.$inputNode.after(_this.$domNode);
        _this.$domNode.on('change', _this.onChange);

        _this.$runway        = $('.euislider-runway', _this.$domNode);

        _this.$pointers      = $('.pointer', _this.$domNode);
        _this.$lowPointer    = _this.$pointers.first();
        _this.$highPointer   = _this.$pointers.last();
        _this.$label         = $('.pointer-label', _this.$domNode);
        _this.$scale         = $('.scale', _this.$domNode);
        _this.$bar           = $('.selected-bar', _this.$domNode);
        _this.interval       = _this.options.to - _this.options.from;
        _this.$wrapnum       = $(".numbox-wrap", _this.$domNode);
        _this.$inputBarInut  = $(".input-bar-right", _this.$domNode);
        _this.$inputNumber   = _this.$inputBarInut.find(".input-number-input");
        _this.movestart      = null;
        _this.render();

    };

    /**
     * 渲染页面
     */
    Silder.pt.render = function() {
        var _this = this;

        // 检测inputNode是否可见以及容器是否设置宽度，以便设置宽度
        if (_this.$inputNode.width() === 0 && !_this.options.width) {
            return;
        } else {
            _this.$domNode.width(_this.options.width || _this.$inputNode.width());
            _this.$inputNode.hide();
        }

        if (_this.isSingle()) {
            _this.$lowPointer.hide();
        }
        if (!_this.options.showLabels) {
            _this.$wrapnum.hide();
        }
        _this.attachEvents();
        _this.circleMove();
        _this.setValue(_this.options.value);
        if (_this.options.showScale) {
            _this.renderScale();
        }
        if(_this.options.showInput){
            _this.$inputBarInut.show();
        }
    };

    /**
     * 指针圆点鼠标事件定义
     */
    Silder.pt.circleMove = function(){
        var _this = this;

        _this.$pointers.on('mousemove mousedown mouseenter', function(event) {
            if (_this.options.showLabels) {
                _this.$wrapnum[0].style.display = "block";
            }
            _this.$runway.css("opacity",1);
        });
        _this.$pointers.on('mouseleave', function(event) {
            if (_this.options.showLabels) 
                _this.$wrapnum[0].style.display = "none";
            _this.$runway.css("opacity","0.75");
        });
    };

    /**
     * 判断当前slider是单值还是范围值
     * @return true 单值  false 范围值
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
     * 监听指针事件
     */
    Silder.pt.attachEvents = function() {
        var _this = this;

        // 注册按下事件
        _this.$pointers.on('mousedown touchstart', $.proxy(_this.onDragStart, this));
        _this.$pointers.bind('dragstart', function(event) {
            event.preventDefault();
        });
    };

    /**
     * 开始拖动指针
     * @param e 事件对象
     */
    Silder.pt.onDragStart = function(e) {
        var _this = this;

        if ( _this.options.disable || (e.type === 'mousedown' && e.which !== 1)) {
            return;
        }
        e.stopPropagation();
        e.preventDefault();
        var pointer = $(e.target);
        _this.$pointers.removeClass('last-active');
        pointer.addClass('focused last-active');
        _this.$label.addClass('focused');
        // 注册移动和结束事件
        $(document).on('mousemove.slider touchmove.slider', $.proxy(_this.onDrag, this, pointer));
        $(document).on('mouseup.slider touchend.slider touchcancel.slider', $.proxy(_this.onDragEnd, this));
        _this.movestart = e.clientX;
    };

    /**
     * 拖动指针过程
     * @param pointer 当前指针对象
     * @param e 事件对象
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

        var position = e.clientX - _this.$domNode.offset().left;
        _this.$domNode.trigger('change', [this, pointer, position]);
    };

    /**
     * 拖动结束
     */
    Silder.pt.onDragEnd = function() {
        var _this = this;

        _this.$pointers.removeClass('focused');
        _this.$label.removeClass('focused');
        $(document).off('.slider');
    };


    /**
     * $domNode的change事件
     * @param e 事件对象
     * @param self this
     * @param pointer 指针对象
     * @param position 位置值
     */
    Silder.pt.onChange = function(e, self, pointer, position) {
        var min, max;
        if (self.isSingle()) {
            min = 0;
            max = self.$domNode.width();
        } else {
            min = pointer.hasClass('high') ? self.$lowPointer.position().left + self.$lowPointer.width() / 2 : 0;
            max = pointer.hasClass('low') ? self.$highPointer.position().left + self.$highPointer.width() / 2 : self.$domNode.width();
        }
        var value = Math.min(Math.max(position, min), max);
        self.setPosition(pointer, value, true);
    };

    /**
     * 设置指针点位置
     * @param pointer 指针对象
     * @param position 位置值
     * @param isPx 是否已经转换成px值
     * @param animate 是否有动效
     */
    Silder.pt.setPosition = function(pointer, position, isPx, animate) {
        var _this = this;

        var leftPos,
            lowPos = _this.$lowPointer.position().left,
            highPos = _this.$highPointer.position().left,
            circleWidth = _this.$highPointer.width() / 2;
        if (!isPx) {
            position = _this.prcToPx(position);
        }
        if (pointer[0] === _this.$highPointer[0]) {
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
        _this.$bar[animate ? 'animate' : 'css']({
            'width': Math.round(highPos + circleWidth - leftPos),
            'left': leftPos
        });
        _this.showPointerValue(pointer, position, animate);
        _this.isReadonly();
    };

    /**
     * 根据初始值设置指针位置
     * @param value 指针位置值
     */
    Silder.pt.setValue = function(value) {
        var _this = this;

        var values = value.toString().split(',');
        _this.options.value = value;
        var prc = _this.valuesToPrc(values.length === 2 ? values : [0, values[0]]);
        if (_this.isSingle()) {
            _this.setPosition(_this.$highPointer, prc[1]);
        } else {
            _this.setPosition(_this.$lowPointer, prc[0]);
            _this.setPosition(_this.$highPointer, prc[1]);
        }
    };

    /**
     * 渲染分段数值
     */
    Silder.pt.renderScale = function() {
        var _this = this;

        var s = _this.options.scale || [_this.options.from, _this.options.to];
        var prc = Math.round((100 / (s.length - 1)) * 10) / 10;
        var str = '';
        for (var i = 0; i < s.length; i++) {
            str += '<span style="left: ' + i * prc + '%">' + (s[i] != '|' ? '<ins>' + s[i] + '</ins>' : '') + '</span>';
        }
        _this.$scale.html(str);

        $('ins', _this.$scale).each(function() {
            $(this).css({
                marginLeft: -$(this).outerWidth() / 2
            });
        });
    };

    /**
     * 显示指针对应值及位置
     * @param pointer 指针对象
     * @param position 位置值
     * @param animate 是否有动效
     */
    Silder.pt.showPointerValue = function(pointer, position, animate) {
        var _this = this;

        var label = _this.$label;
        var text;
        var value = _this.positionToValue(position);
        _this.$inputNumber.val(value);
        if ($.isFunction(_this.options.format)) {
            var type = _this.isSingle() ? undefined : (pointer.hasClass('low') ? 'low' : 'high');
            text = _this.options.format(value, type);
        } else {
            text = _this.options.format.replace('%s', value);
        }

        var width = label.html(text).width(),
            left = position - width / 2;
        left = Math.min(Math.max(left, -22), this.options.width );
        _this.$wrapnum[animate ? 'animate' : 'css']({
            left: left
        });
        _this.setInputValue(pointer, value);
    };

    /**
     * 数值与占比转换
     * @param values[2] 可选范围数值数组
     * @return [lowPrc, highPrc] 范围起始点比例值
     */
    Silder.pt.valuesToPrc = function(values) {
        var _this = this;

        var lowPrc = ((values[0] - _this.options.from) * 100 / _this.interval),
            highPrc = ((values[1] - _this.options.from) * 100 / _this.interval);
        return [lowPrc, highPrc];
    };

    /**
     * 占比与位置px转换
     * @param prc 比例值
     * @return 位置px值
     */
    Silder.pt.prcToPx = function(prc) {
        return (this.$domNode.width() * prc) / 100;
    };

    /**
     * 位置值转换成实际数值
     * @param pos 位置值
     * @return 实际数值
     */
    Silder.pt.positionToValue = function(pos) {
        var _this = this;

        var value = (pos / _this.$domNode.width()) * _this.interval;
        value = value + _this.options.from;
        return Math.round(value / _this.options.step) * _this.options.step;
    };

    /**
     * 设置值到初始对象中
     * @param pointer 指针对象
     * @param value 当前指针对应的值
     */
    Silder.pt.setInputValue = function(pointer, value) {
        var _this = this;

        if (_this.isSingle()) {
            _this.options.value = value.toString();
        } else {
            var values = _this.options.value.split(',');
            if (pointer.hasClass('low')) {
                _this.options.value = value + ',' + values[1];
            } else {
                _this.options.value = values[0] + ',' + value;
            }
        }
        if (_this.$inputNode.val() !== _this.options.value) {
            _this.$inputNode.val(_this.options.value);
        }
    };

    /**
     * 根据参数disable值设置是否可拖拽（只读）
     */
    Silder.pt.isReadonly = function(){
        var _this = this;

        _this.$domNode.toggleClass('slider-readonly', _this.options.disable);
    };

    /**
     * 格式化参数
     * @param string
     */
    Silder.pt.parseOptions = function (string) {
        if ($.isPlainObject(string)) {
            return string;
        }

        var start = (string ? string.indexOf('{') : -1),
            options = {};

        if (start != -1) {
            try {
                options = (new Function('', 'var json = ' + string.substr(start) + '; return JSON.parse(JSON.stringify(json));'))();
            } catch (e) {
            }
        }
        return options;
    }


    // 组件入口1
    function euiSilder(option) {
        var args = Array.prototype.slice.call(arguments, 1);

        return this.each(function () {
            var target = this,
                $this = $(target),
                data = $this.data('euiSilder');

            if (!data) {
                $this.data('euiSilder', (data = new Silder(target, option)));
            }

            if (typeof option == 'string') {
                data[option] && data[option].apply(data, args);
            }
        });
    }

    // 组件入口2
    $(window).on('load.euiSilder', function () {
        $('[data-euiSilder]').each(function () {
            var $this = $(this);
            $this.euiSilder(Silder.pt.parseOptions($this.data('euisilder')));
        });
    });

    $.fn.euiSilder = euiSilder;

}(window);