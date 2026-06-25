'use strict';

(function () {
  window.App = window.App || {};
  var App = window.App;

  // 安全的选择器
  App.$ = function (selector) {
    return document.querySelector(selector);
  };

  App.$$ = function (selector) {
    return document.querySelectorAll(selector);
  };

  // 显示元素（移除 .hidden）
  App.show = function (el) {
    if (typeof el === 'string') el = App.$(el);
    if (el) el.classList.remove('hidden');
  };

  // 隐藏元素（添加 .hidden）
  App.hide = function (el) {
    if (typeof el === 'string') el = App.$(el);
    if (el) el.classList.add('hidden');
  };

  // 防抖函数
  App.debounce = function (fn, delay) {
    var timer;
    return function () {
      var args = arguments;
      var context = this;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  };

  // 安全转义 HTML（防止 XSS）
  App.escapeHTML = function (str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };
})();
