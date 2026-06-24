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
