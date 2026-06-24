'use strict';

function $(selector) {
  return document.querySelector(selector);
}

document.addEventListener('DOMContentLoaded', () => {
  const yearEl = $('footer p');
  if (yearEl) {
    yearEl.textContent = `© ${new Date().getFullYear()} Tan Runzhe`;
  }
});

console.log('🚀 项目已就绪');

// ===== 暗色模式切换 =====
const THEME_KEY = 'theme';
const DARK = 'dark';
const LIGHT = 'light';

const themeToggle = $('#theme-toggle');

function getInitialTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === DARK || stored === LIGHT) return stored;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return DARK;
  return LIGHT;
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (themeToggle) {
    themeToggle.textContent = theme === DARK ? '☀️' : '🌙';
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || LIGHT;
  const next = current === DARK ? LIGHT : DARK;
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

const initialTheme = getInitialTheme();
applyTheme(initialTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem(THEME_KEY)) {
    applyTheme(e.matches ? DARK : LIGHT);
  }
});
