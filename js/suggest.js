'use strict';

(function () {
  var App = window.App;

  // 配置
  var DEBOUNCE_DELAY = 400;
  var MIN_QUERY_LENGTH = 2;

  // 私有状态
  var selectedTags = [];
  var allSuggestedTags = [];
  var currentRequestId = 0;
  var controller = null;

  // 获取 API 基础 URL
  function getApiBase() {
    var host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')) {
      return 'https://my-website-two-fawn-12.vercel.app';
    }
    return '';
  }

  // ===== API 调用 =====
  async function fetchSuggestions(query) {
    // 取消上一次请求
    if (controller) controller.abort();
    controller = new AbortController();
    var requestId = ++currentRequestId;

    try {
      var params = new URLSearchParams({ q: query });
      var response = await fetch(getApiBase() + '/api/suggest?' + params.toString(), {
        signal: controller.signal,
      });

      // 忽略过期响应
      if (requestId !== currentRequestId) return;

      if (!response.ok) {
        showSuggestState('error');
        return;
      }

      var data = await response.json();
      if (requestId !== currentRequestId) return;

      allSuggestedTags = (data.tags || []);
      if (allSuggestedTags.length === 0) {
        showSuggestState('empty');
      } else {
        renderSuggestions();
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (requestId !== currentRequestId) return;
      console.error('建议获取失败:', err);
      showSuggestState('error');
    }
  }

  // ===== 渲染 =====
  function hideAllSuggestStates() {
    App.hide('#suggest-tags');
    App.hide('#suggest-loading');
    App.hide('#suggest-empty');
    App.hide('#suggest-error');
  }

  function showSuggestState(state) {
    hideAllSuggestStates();
    App.show('#suggest-' + state);
  }

  function renderSuggestions() {
    var panel = App.$('#suggest-panel');
    var tagsContainer = App.$('#suggest-tags');
    if (!panel || !tagsContainer) return;

    App.show('#suggest-panel');
    hideAllSuggestStates();

    tagsContainer.innerHTML = '';
    allSuggestedTags.forEach(function (tag) {
      var chip = document.createElement('span');
      chip.className = 'suggest-tag';
      chip.textContent = tag;
      chip.setAttribute('data-tag', tag);
      chip.setAttribute('tabindex', '0');
      chip.setAttribute('role', 'checkbox');
      chip.setAttribute('aria-checked', 'false');

      // 已选中？
      if (selectedTags.indexOf(tag) !== -1) {
        chip.classList.add('suggest-tag--selected');
        chip.setAttribute('aria-checked', 'true');
      }

      chip.addEventListener('click', function () {
        toggleTag(tag, chip);
      });

      chip.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleTag(tag, chip);
        }
      });

      tagsContainer.appendChild(chip);
    });

    App.show('#suggest-tags');
  }

  // ===== 标签选择/取消 =====
  function toggleTag(tag, chipElement) {
    var index = selectedTags.indexOf(tag);
    if (index === -1) {
      selectedTags.push(tag);
      if (chipElement) {
        chipElement.classList.add('suggest-tag--selected');
        chipElement.setAttribute('aria-checked', 'true');
      }
    } else {
      selectedTags.splice(index, 1);
      if (chipElement) {
        chipElement.classList.remove('suggest-tag--selected');
        chipElement.setAttribute('aria-checked', 'false');
      }
    }
    renderSelectedTags();
  }

  function renderSelectedTags() {
    var container = App.$('#selected-tags');
    if (!container) return;

    if (selectedTags.length === 0) {
      App.hide('#selected-tags');
      container.innerHTML = '';
      return;
    }

    App.show('#selected-tags');
    container.innerHTML = '';

    selectedTags.forEach(function (tag) {
      var chip = document.createElement('span');
      chip.className = 'selected-tag';
      chip.textContent = tag + ' ×';
      chip.setAttribute('aria-label', '移除标签: ' + tag);
      chip.setAttribute('tabindex', '0');
      chip.addEventListener('click', function () {
        removeTag(tag);
      });
      chip.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          removeTag(tag);
        }
      });
      container.appendChild(chip);
    });
  }

  function removeTag(tag) {
    selectedTags = selectedTags.filter(function (t) { return t !== tag; });
    renderSelectedTags();
    // 同步更新建议面板中的芯片状态
    var chips = App.$$('.suggest-tag');
    chips.forEach(function (chip) {
      if (chip.getAttribute('data-tag') === tag) {
        chip.classList.remove('suggest-tag--selected');
        chip.setAttribute('aria-checked', 'false');
      }
    });
  }

  // ===== 公开 API =====
  App.getSelectedTags = function () {
    return selectedTags.slice();
  };

  App.clearSelectedTags = function () {
    selectedTags = [];
    renderSelectedTags();
    var chips = App.$$('.suggest-tag--selected');
    chips.forEach(function (chip) {
      chip.classList.remove('suggest-tag--selected');
      chip.setAttribute('aria-checked', 'false');
    });
  };

  App.getCombinedQuery = function () {
    var input = App.$('#search-input');
    var baseQuery = (input ? input.value.trim() : '');
    if (selectedTags.length === 0) return baseQuery;
    return baseQuery + ' ' + selectedTags.join(' ');
  };

  App.hideSuggestPanel = function () {
    App.hide('#suggest-panel');
  };

  // ===== 输入监听（防抖） =====
  var handleInput = App.debounce(function () {
    var input = App.$('#search-input');
    if (!input) return;
    var query = input.value.trim();

    if (query.length < MIN_QUERY_LENGTH) {
      App.hide('#suggest-panel');
      return;
    }

    App.show('#suggest-panel');
    showSuggestState('loading');
    fetchSuggestions(query);
  }, DEBOUNCE_DELAY);

  // ===== 点击面板外关闭 =====
  function handleClickOutside(e) {
    var panel = App.$('#suggest-panel');
    var input = App.$('#search-input');
    var selectedContainer = App.$('#selected-tags');
    if (!panel || panel.classList.contains('hidden')) return;

    setTimeout(function () {
      var activeEl = document.activeElement;
      var hitPanel = panel.contains(activeEl);
      var hitInput = activeEl === input;
      var hitSelected = selectedContainer && selectedContainer.contains(activeEl);
      if (!hitPanel && !hitInput && !hitSelected) {
        App.hide('#suggest-panel');
      }
    }, 150);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      App.hide('#suggest-panel');
      var input = App.$('#search-input');
      if (input) input.blur();
    }
  }

  // ===== 初始化 =====
  function init() {
    var input = App.$('#search-input');
    if (input) {
      input.addEventListener('input', handleInput);
      input.addEventListener('focus', function () {
        var q = input.value.trim();
        if (q.length >= MIN_QUERY_LENGTH && allSuggestedTags.length > 0) {
          App.show('#suggest-panel');
          hideAllSuggestStates();
          renderSuggestions();
        }
      });
      input.addEventListener('keydown', handleKeyDown);
    }

    document.addEventListener('click', handleClickOutside);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
