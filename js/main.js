'use strict';

// 初始化全局共享状态
window.App = window.App || {};
window.App.state = {
  query: '',
  page: 1,
  perPage: 20,
  total: 0,
  results: [],
  isLoading: false,
  hasMore: false,
};

function $(selector) {
  return document.querySelector(selector);
}

document.addEventListener('DOMContentLoaded', function () {
  var yearEl = $('footer p');
  if (yearEl) {
    yearEl.textContent = '\u00A9 ' + new Date().getFullYear() + ' Tan Runzhe';
  }

  // 若 URL 带有 search query 参数（如 ?q=猫），自动触发搜索
  var params = new URLSearchParams(window.location.search);
  var autoQuery = params.get('q');
  if (autoQuery) {
    var input = App.$('#search-input');
    if (input) {
      input.value = autoQuery;
      App.handleSearch();
    }
  }
});

console.log('\uD83D\uDE80 项目已就绪');

// ===== 暗色模式切换 =====
var THEME_KEY = 'theme';
var DARK = 'dark';
var LIGHT = 'light';

var themeToggle = $('#theme-toggle');

function getInitialTheme() {
  var stored = localStorage.getItem(THEME_KEY);
  if (stored === DARK || stored === LIGHT) return stored;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return DARK;
  return LIGHT;
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (themeToggle) {
    themeToggle.textContent = theme === DARK ? '\u2600\uFE0F' : '\uD83C\uDF19';
  }
}

function toggleTheme() {
  var current = document.documentElement.getAttribute('data-theme') || LIGHT;
  var next = current === DARK ? LIGHT : DARK;
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

var initialTheme = getInitialTheme();
applyTheme(initialTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
  if (!localStorage.getItem(THEME_KEY)) {
    applyTheme(e.matches ? DARK : LIGHT);
  }
});
