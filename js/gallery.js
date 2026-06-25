'use strict';

(function () {
  var App = window.App;

  // 渲染结果卡片
  App.renderResults = function (results) {
    var grid = App.$('#results-grid');
    if (!grid) return;

    grid.innerHTML = '';

    results.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'image-card';
      card.setAttribute('data-id', item.id);

      // 占位背景色（在图片加载前显示）
      card.style.backgroundColor = item.color || '#e2e8f0';

      var img = document.createElement('img');
      img.className = 'image-card-thumb';
      img.src = item.medium || item.thumbnail;
      img.alt = (App.escapeHTML && App.escapeHTML(item.alt)) || item.alt || '';
      img.loading = 'lazy';

      // 图片加载失败时显示占位色
      img.onerror = function () {
        img.style.display = 'none';
        card.style.minHeight = '150px';
      };

      var info = document.createElement('div');
      info.className = 'image-card-info';

      var photographer = document.createElement('span');
      photographer.className = 'image-card-photographer';
      photographer.textContent = item.photographer || 'Unknown';

      var source = document.createElement('span');
      source.className = 'image-card-source';
      source.textContent = item.source;

      info.appendChild(photographer);
      info.appendChild(source);

      card.appendChild(img);
      card.appendChild(info);

      // 点击打开弹窗
      card.addEventListener('click', function () {
        App.openModal(item);
      });

      grid.appendChild(card);
    });

    // 更新加载更多按钮
    var loadMoreBtn = App.$('#load-more-btn');
    if (loadMoreBtn) {
      if (App.state.hasMore) {
        loadMoreBtn.textContent =
          '加载更多（剩余 ' +
          (App.state.total - App.state.results.length) +
          ' 张）';
        loadMoreBtn.disabled = false;
      } else {
        loadMoreBtn.textContent = '没有更多了';
        loadMoreBtn.disabled = true;
      }
    }
  };
})();
