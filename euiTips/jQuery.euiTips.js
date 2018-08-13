/**
 * @jQuery.euiTips.js
 * @author rockyxia
 * @version v0.1.0
 * Created: 18-08-01
 */
!(function(window) {
  'use strict'

  function Tips(element, options) {
    this.element = element
    this.$element = $(element)
    this.doc = $(document)
    this.win = $(window)
    this.options = $.extend({}, Tips.DEFAULTS, options || {})
    this.ieFade = !supportsTransitions
    this._title = this.$element.attr('title')
    this.mode = 'hide'
    this.options.preferedPosition = this.options.position
    this.init()
  }

  var pluginName = 'euiTips'
  Tips.DEFAULTS = {
    speed: 400, //动画运行速度
    background: '#373c42', // 提示框背景颜色
    titleBackground: '#000', // 标题栏背景颜色
    color: '#ffffff', // 提示框文字颜色
    titleColor: '#ffffff', // 标题栏颜色
    titleContent: '', // 标题栏内容
    showArrow: true, //是否显示指示三角形
    position: 'top', // 提示框位置
    width: 'auto', // 提示框宽度
    maxWidth: '', // 提示框最大宽度
    delay: 200, // 延时
    hideDelay: 0, // 隐藏延时
    animationIn: '', // 进入动画
    animationOut: '', // 隐藏动画
    offsetX: 0, // 提示框位置X
    offsetY: 0, // 提示框位置Y
    arrowWidth: 4, // 三角形宽度
    tooltipHover: false,
    content: null, // 提示框内容
    ajaxContentUrl: null, // ajax异步获取内容
    ajaxContentBuffer: 0, // 数据缓存时间
    contentElementId: null, // 内容存放的dom id
    useTitle: true, // 是否适用标题作为内容
    templateEngineFunc: null, // 内容显示模版
    onBeforeShow: null, // 显示前回调
    onShow: null, // 显示后回调
    onHide: null // 隐藏后回调
  }

  // 缓存原型
  Tips.pt = Tips.prototype

  /**
   * 初始化
   */
  Tips.pt.init = function() {
    var _this = this,
      $e = _this.$element
    // $doc = _this.doc
    // 原始的title属性隐藏
    $e.attr('title', '')

    if (_this.options.tooltipHover) {
      var waitForHover = null,
        hoverHelper = null

      $e.on('mouseover' + '.' + pluginName, function() {
        clearTimeout(waitForHover)
        clearTimeout(hoverHelper)
        hoverHelper = setTimeout(function() {
          _this.show()
        }, 150)
      })

      $e.on('mouseout' + '.' + pluginName, function() {
        clearTimeout(waitForHover)
        clearTimeout(hoverHelper)
        waitForHover = setTimeout(function() {
          _this.hide()
        }, 200)

        _this
          .tooltip()
          .on('mouseover' + '.' + pluginName, function() {
            _this.mode = 'tooltipHover'
          })
          .on('mouseout' + '.' + pluginName, function() {
            _this.mode = 'show'
            clearTimeout(waitForHover)
            waitForHover = setTimeout(function() {
              _this.hide()
            }, 200)
          })
      })
    } else {
      $e.on('mouseover' + '.' + pluginName, function() {
        _this.show()
      })

      $e.on('mouseout' + '.' + pluginName, function() {
        _this.hide()
      })
    }

    if (_this.options.ajaxContentUrl) {
      _this.ajaxContent = null
    }
  }

  /**
   * 初始化提示框dom
   */
  Tips.pt.tooltip = function() {
    if (!this.euiTips_pop) {
      this.euiTips_pop = $(
        '<div class="euitips_pop"><div class="euitips_title"></div><div class="euitips_content"></div><div class="euitips_arrow"></div></div>'
      )
    }
    return this.euiTips_pop
  }

  /**
   * 显示
   */
  Tips.pt.show = function() {
    var euiTips_pop = this.tooltip(),
      _this = this,
      $win = _this.win

    if (_this.options.showArrow) {
      euiTips_pop.find('.euitips_arrow').show()
    } else {
      euiTips_pop.find('.euitips_arrow').hide()
    }

    if (_this.mode === 'hide') {
      // 显示前回调函数
      if ($.isFunction(_this.options.onBeforeShow)) {
        _this.options.onBeforeShow(_this.$element, _this.element, _this)
      }

      // 自定义皮肤
      // if (_this.options.skin) {
      //   euiTips_pop.addClass(_this.options.skin)
      // }

      euiTips_pop.css({
        background: _this.options.background,
        color: _this.options.color
      })

      if (_this.options.width) {
        euiTips_pop
          .css({
            width: _this.options.width
          })
          .hide()
      } else if (_this.options.maxWidth) {
        euiTips_pop
          .css({
            maxWidth: _this.options.maxWidth
          })
          .hide()
      } else {
        euiTips_pop
          .css({
            width: 200
          })
          .hide()
      }

      euiTips_pop.find('.euitips_title').css({
        background: _this.options.titleBackground,
        color: _this.options.titleColor
      })
      euiTips_pop.find('.euitips_content').html(_this.content())
      euiTips_pop.find('.euitips_title').html(_this.titleContent())
      _this.reposition(_this)

      $win.on('resize' + '.' + pluginName, function euitipsResizeHandler() {
        _this.options.position = _this.options.preferedPosition
        _this.reposition(_this)
      })

      window.clearTimeout(_this.timeout)
      _this.timeout = null
      _this.timeout = window.setTimeout(function() {
        if (
          _this.ieFade ||
          _this.options.animationIn === '' ||
          _this.options.animationOut === ''
        ) {
          euiTips_pop
            .appendTo('body')
            .stop(true, true)
            .fadeIn(_this.options.speed, function() {
              _this.mode = 'show'
              // 显示后回调函数
              if ($.isFunction(_this.options.onShow)) {
                _this.options.onShow(_this.$element, _this.element, _this)
              }
            })
        } else {
          euiTips_pop
            .remove()
            .appendTo('body')
            .stop(true, true)
            .removeClass('animated ' + _this.options.animationOut)
            .addClass('noAnimation')
            .removeClass('noAnimation')
            .addClass('animated ' + _this.options.animationIn)
            .fadeIn(_this.options.speed, function() {
              $(this).one(
                'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',
                function() {
                  $(this).removeClass('animated ' + _this.options.animationIn)
                }
              )
              _this.mode = 'show'
              // 显示后回调函数
              if ($.isFunction(_this.options.onShow)) {
                _this.options.onShow(_this.$element, _this.element, _this)
              }
              $win.off(
                'resize' + '.' + pluginName,
                null,
                'euitipsResizeHandler'
              )
            })
        }
      }, _this.options.delay)
    }
  }

  /**
   * 隐藏
   */
  Tips.pt.hide = function(force) {
    var _this = this,
      $win = _this.win,
      euiTips_pop = _this.tooltip(),
      hideDelay = _this.options.hideDelay

    if (force) {
      hideDelay = 0
      _this.mode = 'show'
    }

    window.clearTimeout(_this.timeout)
    _this.timeout = null
    _this.timeout = window.setTimeout(function() {
      if (_this.mode !== 'tooltipHover') {
        if (
          _this.ieFade ||
          _this.options.animationIn === '' ||
          _this.options.animationOut === ''
        ) {
          euiTips_pop.stop(true, true).fadeOut(_this.options.speed, function() {
            $(this).remove()
            // 隐藏后回调函数
            if ($.isFunction(_this.options.onHide) && _this.mode === 'show') {
              _this.options.onHide(_this.$element, _this.element, _this)
            }
            _this.mode = 'hide'
            $win.off('resize' + '.' + pluginName, null, 'euitipsResizeHandler')
          })
        } else {
          euiTips_pop
            .stop(true, true)
            .removeClass('animated ' + _this.options.animationIn)
            .addClass('noAnimation')
            .removeClass('noAnimation')
            .addClass('animated ' + _this.options.animationOut)
            .one(
              'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',
              function() {
                $(this)
                  .removeClass('animated ' + _this.options.animationOut)
                  .remove()
                // 隐藏后回调函数
                if (
                  $.isFunction(_this.options.onHide) &&
                  _this.mode === 'show'
                ) {
                  _this.options.onHide(_this.$element, _this.element, _this)
                }
                _this.mode = 'hide'
                $win.off(
                  'resize' + '.' + pluginName,
                  null,
                  'euitipsResizeHandler'
                )
              }
            )
        }
      }
    }, hideDelay)
  }

  /**
   * 关闭
   */
  Tips.pt.close = function() {
    this.hide(true)
  }

  /**
   * 销毁
   */
  Tips.pt.destroy = function() {
    var $e = this.$element,
      $win = this.win

    $e.off('.' + pluginName)
    $win.off('resize' + '.' + pluginName, null, 'euitipsResizeHandler')
    $e.removeData(pluginName)
    $e.removeClass('euitips_style').attr('title', this._title)
  }

  /**
   * 获取标题内容
   */
  Tips.pt.titleContent = function() {
    var content,
      $e = this.$element,
      _this = this

    if (_this.options.titleContent) {
      content = _this.options.titleContent
    } else {
      content = $e.data('euitips-title')
    }
    return content
  }

  /**
   * 获取提示内容
   */
  Tips.pt.content = function() {
    var content,
      // $e = this.$element,
      _this = this,
      title = this._title

    if (_this.options.ajaxContentUrl) {
      // 如果有异步获取内容的地址
      if (_this._ajaxContent) {
        content = _this._ajaxContent
      } else {
        _this._ajaxContent = content = $.ajax({
          type: 'GET',
          url: _this.options.ajaxContentUrl,
          async: false
        }).responseText

        if (_this.options.ajaxContentBuffer > 0) {
          setTimeout(function() {
            _this._ajaxContent = null
          }, _this.options.ajaxContentBuffer)
        } else {
          _this._ajaxContent = null
        }
      }
    } else if (_this.options.contentElementId) {
      // 如果有存放内容dom元素
      content = $('#' + _this.options.contentElementId).text()
    } else if (_this.options.content) {
      // 如果设置了content
      content = _this.options.content
    } else {
      if (_this.options.useTitle === true) {
        content = title
      } else {
        content = '未设置提示语'
      }
    }
    if (_this.options.templateEngineFunc !== null) {
      content = _this.options.templateEngineFunc(content)
    }
    return content
  }

  /**
   * 更新参数配置
   */
  Tips.pt.update = function(key, value) {
    var _this = this
    if (value) {
      _this.options[key] = value
    } else {
      return _this.options[key]
    }
  }

  /**
   * 获取元素真实高度
   */
  Tips.pt.realHeight = function(obj) {
    var clone = obj.clone()
    clone.css('visibility', 'hidden')
    $('body').append(clone)
    var height = clone.outerHeight()
    var width = clone.outerWidth()
    clone.remove()
    return {
      width: width,
      height: height
    }
  }

  /**
   * 是否支持transition
   */
  var supportsTransitions = (function() {
    var s = document.createElement('p').style,
      v = ['ms', 'O', 'Moz', 'Webkit']
    if (s['transition'] === '') return true
    while (v.length) if (v.pop() + 'Transition' in s) return true
    return false
  })()

  /**
   * 移除所有样式
   */
  Tips.pt.removeCornerClasses = function(obj) {
    obj.removeClass(
      'top_right_corner bottom_right_corner top_left_corner bottom_left_corner'
    )
    obj
      .find('.euitips_title')
      .removeClass(
        'top_right_corner bottom_right_corner top_left_corner bottom_left_corner'
      )
  }

  /**
   * 
  设置提示框位置
   */
  Tips.pt.reposition = function(thisthat) {
    var euiTips_pop = thisthat.tooltip(),
      $e = thisthat.$element,
      _this = thisthat,
      $win = $(window),
      arrow = 8,
      pos_top,
      pos_left,
      diff

    var arrow_color = _this.options.background
    var title_content = _this.titleContent()
    if (title_content !== undefined && title_content !== '') {
      arrow_color = _this.options.titleBackground
    }

    if ($e.parent().outerWidth() > $win.outerWidth()) {
      $win = $e.parent()
    }

    switch (_this.options.position) {
      /*
       * 上右
       */
      case 'top-right':
        pos_left = $e.offset().left + $e.outerWidth()
        pos_top = $e.offset().top - _this.realHeight(euiTips_pop).height - arrow
        euiTips_pop.find('.euitips_arrow').css({
          marginLeft: 2 * _this.options.arrowWidth,
          marginTop: ''
        })
        if (pos_top < $win.scrollTop()) {
          pos_top = $e.offset().top + $e.outerHeight() + arrow

          euiTips_pop.find('.euitips_arrow').css({
            'border-bottom-color': arrow_color,
            'border-top-color': 'transparent',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          })

          /*
           * 隐藏并显示适当的圆角
           */
          _this.removeCornerClasses(euiTips_pop)
          // euiTips_pop.addClass('bottom_right_corner')
          // euiTips_pop.find('.euitips_title').addClass('bottom_right_corner')
          euiTips_pop.find('.euitips_arrow').css({
            'border-left-color': arrow_color
          })

          euiTips_pop.removeClass('top-right top bottom left right')
          euiTips_pop.addClass('bottom')
        } else {
          euiTips_pop.find('.euitips_arrow').css({
            'border-top-color': _this.options.background,
            'border-bottom-color': 'transparent ',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          })

          /*
           * 隐藏并显示适当的圆角
           */
          _this.removeCornerClasses(euiTips_pop)
          // euiTips_pop.addClass('top_right_corner')
          euiTips_pop.find('.euitips_arrow').css({
            'border-left-color': _this.options.background
          })

          euiTips_pop.removeClass('top bottom left right')
          euiTips_pop.addClass('top')
        }
        break
      /*
       * 上左
       */
      case 'top-left':
        pos_left = $e.offset().left - _this.realHeight(euiTips_pop).width
        pos_top = $e.offset().top - _this.realHeight(euiTips_pop).height - arrow
        euiTips_pop.find('.euitips_arrow').css({
          marginLeft: -_this.options.arrowWidth,
          marginTop: ''
        })
        if (pos_top < $win.scrollTop()) {
          pos_top = $e.offset().top + $e.outerHeight() + arrow

          euiTips_pop.find('.euitips_arrow').css({
            'border-bottom-color': arrow_color,
            'border-top-color': 'transparent',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          })

          /*
           * 隐藏并显示适当的圆角
           */
          _this.removeCornerClasses(euiTips_pop)
          // euiTips_pop.addClass('bottom_left_corner')
          // euiTips_pop.find('.euitips_title').addClass('bottom_left_corner')
          euiTips_pop.find('.euitips_arrow').css({
            'border-right-color': arrow_color
          })

          euiTips_pop.removeClass('top-right top bottom left right')
          euiTips_pop.addClass('bottom')
        } else {
          euiTips_pop.find('.euitips_arrow').css({
            'border-top-color': _this.options.background,
            'border-bottom-color': 'transparent ',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          })

          /*
           * 隐藏并显示适当的圆角
           */
          _this.removeCornerClasses(euiTips_pop)
          // euiTips_pop.addClass('top_left_corner')
          euiTips_pop.find('.euitips_arrow').css({
            'border-right-color': _this.options.background
          })

          euiTips_pop.removeClass('top bottom left right')
          euiTips_pop.addClass('top')
        }
        break

      /*
       * 下右
       */
      case 'bottom-right':
        pos_left = $e.offset().left + $e.outerWidth()
        pos_top = $e.offset().top + $e.outerHeight() + arrow
        euiTips_pop.find('.euitips_arrow').css({
          marginLeft: -_this.options.arrowWidth,
          marginTop: ''
        })
        if (
          pos_top + _this.realHeight(euiTips_pop).height >
          $win.scrollTop() + $win.outerHeight()
        ) {
          pos_top =
            $e.offset().top - _this.realHeight(euiTips_pop).height - arrow

          euiTips_pop.find('.euitips_arrow').css({
            'border-bottom-color': 'transparent',
            'border-top-color': _this.options.background,
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          })

          /*
          * 隐藏并显示适当的圆角
          */
          removeCornerClasses(euiTips_pop)
          // euiTips_pop.addClass('top_right_corner')
          // euiTips_pop.find('.euitips_title').addClass('top_left_corner')
          euiTips_pop.find('.euitips_arrow').css({
            'border-left-color': _this.options.background
          })

          euiTips_pop.removeClass('top-right top bottom left right')
          euiTips_pop.addClass('top')
        } else {
          euiTips_pop.find('.euitips_arrow').css({
            'border-top-color': 'transparent',
            'border-bottom-color': arrow_color,
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          })

          /*
          * 隐藏并显示适当的圆角
          */
          _this.removeCornerClasses(euiTips_pop)
          // euiTips_pop.addClass('bottom_right_corner')
          // euiTips_pop.find('.euitips_title').addClass('bottom_right_corner')
          euiTips_pop.find('.euitips_arrow').css({
            'border-left-color': arrow_color
          })

          euiTips_pop.removeClass('top bottom left right')
          euiTips_pop.addClass('bottom')
        }
        break

      /*
        * 下左
        */
      case 'bottom-left':
        pos_left = $e.offset().left - _this.realHeight(euiTips_pop).width
        pos_top = $e.offset().top + $e.outerHeight() + arrow
        euiTips_pop.find('.euitips_arrow').css({
          marginLeft: -_this.options.arrowWidth,
          marginTop: ''
        })
        if (
          pos_top + _this.realHeight(euiTips_pop).height >
          $win.scrollTop() + $win.outerHeight()
        ) {
          pos_top =
            $e.offset().top - _this.realHeight(euiTips_pop).height - arrow

          euiTips_pop.find('.euitips_arrow').css({
            'border-bottom-color': 'transparent',
            'border-top-color': _this.options.background,
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          })

          /*
           * 隐藏并显示适当的圆角
           */
          removeCornerClasses(euiTips_pop)
          // euiTips_pop.addClass('top_left_corner')
          // euiTips_pop.find('.euitips_title').addClass('top_left_corner')
          euiTips_pop.find('.euitips_arrow').css({
            'border-right-color': _this.options.background
          })

          euiTips_pop.removeClass('top-right top bottom left right')
          euiTips_pop.addClass('top')
        } else {
          euiTips_pop.find('.euitips_arrow').css({
            'border-top-color': 'transparent',
            'border-bottom-color': arrow_color,
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          })

          /*
           * 隐藏并显示适当的圆角
           */
          _this.removeCornerClasses(euiTips_pop)
          // euiTips_pop.addClass('bottom_left_corner')
          // euiTips_pop.find('.euitips_title').addClass('bottom_left_corner')
          euiTips_pop.find('.euitips_arrow').css({
            'border-right-color': arrow_color
          })

          euiTips_pop.removeClass('top bottom left right')
          euiTips_pop.addClass('bottom')
        }
        break
      /*
       * 上
       */
      case 'top':
        pos_left =
          $e.offset().left +
          $e.outerWidth() / 2 -
          _this.realHeight(euiTips_pop).width / 2
        pos_top = $e.offset().top - _this.realHeight(euiTips_pop).height - arrow
        euiTips_pop.find('.euitips_arrow').css({
          marginLeft: -_this.options.arrowWidth,
          marginTop: ''
        })
        if (pos_top < $win.scrollTop()) {
          pos_top = $e.offset().top + $e.outerHeight() + arrow

          euiTips_pop.find('.euitips_arrow').css({
            'border-bottom-color': arrow_color,
            'border-top-color': 'transparent',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          })

          euiTips_pop.removeClass('top bottom left right')
          euiTips_pop.addClass('bottom')
        } else {
          euiTips_pop.find('.euitips_arrow').css({
            'border-top-color': _this.options.background,
            'border-bottom-color': 'transparent',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          })
          euiTips_pop.removeClass('top bottom left right')
          euiTips_pop.addClass('top')
        }
        break
      /*
       * 下
       */
      case 'bottom':
        pos_left =
          $e.offset().left +
          $e.outerWidth() / 2 -
          _this.realHeight(euiTips_pop).width / 2
        pos_top = $e.offset().top + $e.outerHeight() + arrow
        euiTips_pop.find('.euitips_arrow').css({
          marginLeft: -_this.options.arrowWidth,
          marginTop: ''
        })
        if (
          pos_top + _this.realHeight(euiTips_pop).height >
          $win.scrollTop() + $win.outerHeight()
        ) {
          pos_top =
            $e.offset().top - _this.realHeight(euiTips_pop).height - arrow
          euiTips_pop.find('.euitips_arrow').css({
            'border-top-color': _this.options.background,
            'border-bottom-color': 'transparent',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          })
          euiTips_pop.removeClass('top bottom left right')
          euiTips_pop.addClass('top')
        } else {
          euiTips_pop.find('.euitips_arrow').css({
            'border-bottom-color': arrow_color,
            'border-top-color': 'transparent',
            'border-left-color': 'transparent',
            'border-right-color': 'transparent'
          })
          euiTips_pop.removeClass('top bottom left right')
          euiTips_pop.addClass(_this.options.position)
        }
        break
      case 'left':
        pos_left =
          $e.offset().left - _this.realHeight(euiTips_pop).width - arrow
        pos_top =
          $e.offset().top +
          $e.outerHeight() / 2 -
          _this.realHeight(euiTips_pop).height / 2
        euiTips_pop.find('.euitips_arrow').css({
          marginTop: -_this.options.arrowWidth,
          marginLeft: ''
        })
        if (pos_left < $win.scrollLeft()) {
          pos_left = $e.offset().left + $e.outerWidth() + arrow
          euiTips_pop.find('.euitips_arrow').css({
            'border-right-color': _this.options.background,
            'border-left-color': 'transparent',
            'border-top-color': 'transparent',
            'border-bottom-color': 'transparent'
          })
          euiTips_pop.removeClass('top bottom left right')
          euiTips_pop.addClass('right')
        } else {
          euiTips_pop.find('.euitips_arrow').css({
            'border-left-color': _this.options.background,
            'border-right-color': 'transparent',
            'border-top-color': 'transparent',
            'border-bottom-color': 'transparent'
          })
          euiTips_pop.removeClass('top bottom left right')
          euiTips_pop.addClass(_this.options.position)
        }
        break
      case 'right':
        pos_left = $e.offset().left + $e.outerWidth() + arrow
        pos_top =
          $e.offset().top +
          $e.outerHeight() / 2 -
          _this.realHeight(euiTips_pop).height / 2
        euiTips_pop.find('.euitips_arrow').css({
          marginTop: -_this.options.arrowWidth,
          marginLeft: ''
        })
        if (
          pos_left + arrow + _this.options.width >
          $win.scrollLeft() + $win.outerWidth()
        ) {
          pos_left =
            $e.offset().left - _this.realHeight(euiTips_pop).width - arrow
          euiTips_pop.find('.euitips_arrow').css({
            'border-left-color': _this.options.background,
            'border-right-color': 'transparent',
            'border-top-color': 'transparent',
            'border-bottom-color': 'transparent'
          })
          euiTips_pop.removeClass('top bottom left right')
          euiTips_pop.addClass('left')
        } else {
          euiTips_pop.find('.euitips_arrow').css({
            'border-right-color': _this.options.background,
            'border-left-color': 'transparent',
            'border-top-color': 'transparent',
            'border-bottom-color': 'transparent'
          })
          euiTips_pop.removeClass('top bottom left right')
          euiTips_pop.addClass(_this.options.position)
        }
        break
    }
    /*
     * 设置三角形的位置
     */
    if (_this.options.position === 'top-right') {
      euiTips_pop.find('.euitips_arrow').css({
        'margin-left': -_this.options.width / 2
      })
    }
    if (_this.options.position === 'top-left') {
      var euitips_arrow = euiTips_pop.find('.euitips_arrow').eq(0)
      euitips_arrow.css({
        'margin-left': _this.options.width / 2 - 2 * _this.options.arrowWidth
      })
    }
    if (_this.options.position === 'bottom-right') {
      var euitips_arrow = euiTips_pop.find('.euitips_arrow').eq(0)
      euitips_arrow.css({
        'margin-left': -_this.options.width / 2,
        'margin-top': ''
      })
    }
    if (_this.options.position === 'bottom-left') {
      var euitips_arrow = euiTips_pop.find('.euitips_arrow').eq(0)
      euitips_arrow.css({
        'margin-left': _this.options.width / 2 - 2 * _this.options.arrowWidth,
        'margin-top': ''
      })
    }

    /*
     * 检测边界
     */
    if (
      pos_left < $win.scrollLeft() &&
      (_this.options.position === 'bottom' || _this.options.position === 'top')
    ) {
      euiTips_pop.find('.euitips_arrow').css({
        marginLeft: pos_left - _this.options.arrowWidth
      })
      pos_left = 0
    }
    if (
      pos_left + _this.options.width > $win.outerWidth() &&
      (_this.options.position === 'bottom' || _this.options.position === 'top')
    ) {
      diff = $win.outerWidth() - (pos_left + _this.options.width)
      euiTips_pop.find('.euitips_arrow').css({
        marginLeft: -diff - _this.options.arrowWidth,
        marginTop: ''
      })
      pos_left = pos_left + diff
    }
    if (
      pos_left < $win.scrollLeft() &&
      (_this.options.position === 'left' ||
        _this.options.position === 'right' ||
        _this.options.position === 'top-right' ||
        _this.options.position === 'top-left' ||
        _this.options.position === 'bottom-right' ||
        _this.options.position === 'bottom-left')
    ) {
      pos_left =
        $e.offset().left +
        $e.outerWidth() / 2 -
        _this.realHeight(euiTips_pop).width / 2
      euiTips_pop.find('.euitips_arrow').css({
        marginLeft: -_this.options.arrowWidth,
        marginTop: ''
      })
      pos_top = $e.offset().top - _this.realHeight(euiTips_pop).height - arrow
      if (pos_top < $win.scrollTop()) {
        pos_top = $e.offset().top + $e.outerHeight() + arrow
        euiTips_pop.find('.euitips_arrow').css({
          'border-bottom-color': arrow_color,
          'border-top-color': 'transparent',
          'border-left-color': 'transparent',
          'border-right-color': 'transparent'
        })
        euiTips_pop.removeClass('top bottom left right')
        removeCornerClasses(euiTips_pop)
        euiTips_pop.addClass('bottom')
      } else {
        euiTips_pop.find('.euitips_arrow').css({
          'border-top-color': _this.options.background,
          'border-bottom-color': 'transparent',
          'border-left-color': 'transparent',
          'border-right-color': 'transparent'
        })
        euiTips_pop.removeClass('top bottom left right')
        _this.removeCornerClasses(euiTips_pop)
        euiTips_pop.addClass('top')
      }
      if (pos_left + _this.options.width > $win.outerWidth()) {
        diff = $win.outerWidth() - (pos_left + _this.options.width)
        euiTips_pop.find('.euitips_arrow').css({
          marginLeft: -diff - _this.options.arrowWidth,
          marginTop: ''
        })
        pos_left = pos_left + diff
      }
      if (pos_left < $win.scrollLeft()) {
        euiTips_pop.find('.euitips_arrow').css({
          marginLeft: pos_left - _this.options.arrowWidth
        })
        pos_left = 0
      }
    }

    /*
     * 如果右侧超出边界
     */
    if (
      pos_left + _this.options.width > $win.outerWidth() &&
      (_this.options.position === 'left' ||
        _this.options.position === 'right' ||
        _this.options.position === 'top-right' ||
        _this.options.position === 'top-left' ||
        _this.options.position === 'bottom-right' ||
        _this.options.position === 'bottom-right')
    ) {
      pos_left =
        $e.offset().left +
        $e.outerWidth() / 2 -
        _this.realHeight(euiTips_pop).width / 2
      euiTips_pop.find('.euitips_arrow').css({
        marginLeft: -_this.options.arrowWidth,
        marginTop: ''
      })
      pos_top = $e.offset().top - _this.realHeight(euiTips_pop).height - arrow
      if (pos_top < $win.scrollTop()) {
        pos_top = $e.offset().top + $e.outerHeight() + arrow
        euiTips_pop.find('.euitips_arrow').css({
          'border-bottom-color': arrow_color,
          'border-top-color': 'transparent',
          'border-left-color': 'transparent',
          'border-right-color': 'transparent'
        })

        _this.removeCornerClasses(euiTips_pop)
        euiTips_pop.removeClass('top bottom left right')
        euiTips_pop.addClass('bottom')
      } else {
        euiTips_pop.find('.euitips_arrow').css({
          'border-top-color': _this.options.background,
          'border-bottom-color': 'transparent',
          'border-left-color': 'transparent',
          'border-right-color': 'transparent'
        })

        /*
         * 隐藏并显示适当的圆角
         */
        _this.removeCornerClasses(euiTips_pop)
        euiTips_pop.removeClass('top bottom left right')
        euiTips_pop.addClass('top')
      }
      if (pos_left + _this.options.width > $win.outerWidth()) {
        diff = $win.outerWidth() - (pos_left + _this.options.width)
        euiTips_pop.find('.euitips_arrow').css({
          marginLeft: -diff - _this.options.arrowWidth,
          marginTop: ''
        })
        pos_left = pos_left + diff
      }
      if (pos_left < $win.scrollLeft()) {
        euiTips_pop.find('.euitips_arrow').css({
          marginLeft: pos_left - _this.options.arrowWidth
        })
        pos_left = 0
      }
    }
    euiTips_pop.css({
      left: pos_left + _this.options.offsetX,
      top: pos_top + _this.options.offsetY
    })

    // 如果向右或向左定位并且提示框超出界限则更改位置
    // 这个位置改变是暂时的，因为preferedPosition起作用了
    if (
      pos_top < $win.scrollTop() &&
      (_this.options.position === 'right' || _this.options.position === 'left')
    ) {
      $e.euiTips('update', 'position', 'bottom')
      _this.reposition(_this)
    }
    if (
      pos_top + _this.realHeight(euiTips_pop).height >
        $win.scrollTop() + $win.outerHeight() &&
      (_this.options.position === 'right' || _this.options.position === 'left')
    ) {
      $e.euiTips('update', 'position', 'top')
      _this.reposition(_this)
    }
  }

  /**
   * 格式化参数
   * @param string
   */
  Tips.pt.parseOptions = function(string) {
    if ($.isPlainObject(string)) {
      return string
    }

    var start = string ? string.indexOf('{') : -1,
      options = {}

    if (start != -1) {
      try {
        options = new Function(
          '',
          'var json = ' +
            string.substr(start) +
            '; return JSON.parse(JSON.stringify(json));'
        )()
      } catch (e) {}
    }
    return options
  }

  // 组件入口1
  function euiTips(option) {
    var args = Array.prototype.slice.call(arguments, 1)

    return this.each(function() {
      var target = this,
        $this = $(target),
        data = false

      // if (!data) {
      $this.data('euitips', (data = new Tips(target, option)))
      // }

      if (typeof option == 'string') {
        data[option] && data[option].apply(data, args)
      }
    })
  }

  // 组件入口2
  $(window).on('load.euiTips', function() {
    $('[data-euitips]').each(function() {
      var $this = $(this)
      $this.euiTips(Tips.pt.parseOptions($this.data('euitips')))
    })
  })

  $.fn.euiTips = euiTips
})(window)
