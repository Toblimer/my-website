'use strict';

(function () {
  var App = window.App;

  App.openModal = function (item) {
    var modal = App.$('#modal');
    if (!modal) return;

    // 显示 loading
    App.hide('#modal-image');
    App.show('#modal-loading');

    // 填充信息
    var sourceEl = App.$('#modal-source');
    if (sourceEl) sourceEl.textContent = item.source;

    var resEl = App.$('#modal-resolution');
    if (resEl) resEl.textContent = item.width + ' × ' + item.height;

    var photographerEl = App.$('#modal-photographer');
    if (photographerEl) {
      photographerEl.textContent = 'Photo by ' + (item.photographer || 'Unknown');
    }

    var downloadBtn = App.$('#modal-download');
    if (downloadBtn) downloadBtn.href = item.sourceUrl;

    // 预加载大图
    var largeImg = new Image();
    largeImg.onload = function () {
      var modalImg = App.$('#modal-image');
      if (modalImg) {
        modalImg.src = item.full;
        modalImg.alt = item.alt || '';
        App.show('#modal-image');
        App.hide('#modal-loading');
      }
    };
    largeImg.onerror = function () {
      // 大图加载失败，用中等尺寸图
      var modalImg = App.$('#modal-image');
      if (modalImg) {
        modalImg.src = item.medium || item.thumbnail;
        modalImg.alt = item.alt || '';
        App.show('#modal-image');
        App.hide('#modal-loading');
      }
    };
    largeImg.src = item.full;

    // 显示弹窗
    App.show('#modal');
    document.body.style.overflow = 'hidden';

    // 焦点管理
    var closeBtn = App.$('.modal-close');
    if (closeBtn) closeBtn.focus();
  };

  App.closeModal = function () {
    App.hide('#modal');
    document.body.style.overflow = '';
    // 清空大图以释放内存
    var modalImg = App.$('#modal-image');
    if (modalImg) modalImg.src = '';
  };

  function init() {
    var closeBtn = App.$('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', App.closeModal);

    var overlay = App.$('.modal-overlay');
    if (overlay) overlay.addEventListener('click', App.closeModal);

    // ESC 关闭
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var modal = App.$('#modal');
        if (modal && !modal.classList.contains('hidden')) {
          App.closeModal();
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
