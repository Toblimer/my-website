'use strict';

(function () {
  var App = window.App;

  // 切换显示的状态视图
  function showState(stateName) {
    var states = ['state-empty', 'state-loading', 'state-no-results', 'state-error'];
    states.forEach(function (id) {
      App.hide('#' + id);
    });
    App.hide('#results-grid');
    App.hide('#load-more');

    if (stateName === 'results') {
      App.show('#results-grid');
      if (App.state.hasMore) App.show('#load-more');
    } else {
      App.show('#state-' + stateName);
    }
  }

  // 执行搜索
  async function doSearch(query, page) {
    App.state.isLoading = true;
    showState('loading');

    try {
      var data = await App.searchImages(query, page);

      if (page === 1) {
        App.state.results = [];
      }
      App.state.query = query;
      App.state.page = page;
      App.state.total = data.total;
      App.state.results = App.state.results.concat(data.results);
      App.state.hasMore = App.state.results.length < data.total;

      if (App.state.results.length === 0) {
        showState('no-results');
      } else {
        App.renderResults(App.state.results);
        showState('results');
      }
    } catch (err) {
      console.error('搜索失败:', err);
      showState('error');
    } finally {
      App.state.isLoading = false;
    }
  }

  // 表单提交
  App.handleSearch = function (event) {
    if (event) event.preventDefault();
    var query = App.$('#search-input').value.trim();
    if (!query) {
      var wrapper = App.$('.search-input-wrapper');
      if (wrapper) {
        wrapper.style.borderColor = 'red';
        setTimeout(function () { wrapper.style.borderColor = ''; }, 1500);
      }
      App.$('#search-input').focus();
      return;
    }
    doSearch(query, 1);
  };

  // 重试
  App.handleRetry = function () {
    doSearch(App.state.query, App.state.page);
  };

  // 加载更多
  App.handleLoadMore = function () {
    if (App.state.isLoading || !App.state.hasMore) return;
    doSearch(App.state.query, App.state.page + 1);
  };

  // 初始化搜索框事件
  function init() {
    var form = App.$('#search-form');
    if (form) form.addEventListener('submit', App.handleSearch);

    var retryBtn = App.$('#retry-btn');
    if (retryBtn) retryBtn.addEventListener('click', App.handleRetry);

    var loadMoreBtn = App.$('#load-more-btn');
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', App.handleLoadMore);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
