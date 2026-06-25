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
  var searchMode = 'union';

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
      chip.setAttribute('data-tag', tag);
      chip.setAttribute('tabindex', '0');
      chip.setAttribute('role', 'checkbox');
      chip.setAttribute('aria-checked', 'false');

      // 标签文本
      var textSpan = document.createElement('span');
      textSpan.className = 'suggest-tag-text';
      textSpan.textContent = tag;
      chip.appendChild(textSpan);

      // 编辑按钮
      var editBtn = document.createElement('button');
      editBtn.className = 'suggest-tag-edit-btn';
      editBtn.setAttribute('aria-label', '编辑标签');
      editBtn.textContent = '\u270E';
      editBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        startEditTag(chip, tag);
      });
      chip.appendChild(editBtn);

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

    // 追加 "+ 自定义" 芯片
    var addChip = document.createElement('span');
    addChip.className = 'suggest-tag suggest-tag--add';
    addChip.innerHTML = '<span class="suggest-tag--add-icon">+</span> 自定义';
    addChip.setAttribute('tabindex', '0');
    addChip.setAttribute('aria-label', '添加自定义标签');
    addChip.addEventListener('click', function (e) {
      e.stopPropagation();
      startAddTag();
    });
    addChip.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startAddTag();
      }
    });
    tagsContainer.appendChild(addChip);

    App.show('#suggest-tags');
  }

  // ===== 标签编辑/添加 =====
  var editingIsCancelling = false; // 防止 blur 覆盖 Esc 取消
  var editingIsCommitting = false; // 防止 blur 二次触发 commit

  function startEditTag(chipElement, currentText) {
    editingIsCancelling = false;
    editingIsCommitting = false;
    chipElement.innerHTML = '';
    chipElement.classList.add('suggest-tag--editing');

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'suggest-tag-input';
    input.value = currentText;
    input.maxLength = 20;
    chipElement.appendChild(input);

    input.focus();
    input.select();

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEditTag(chipElement, input.value.trim(), currentText);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        editingIsCancelling = true;
        cancelEditTag(chipElement, currentText);
      }
    });

    input.addEventListener('blur', function () {
      // 如果是因为 Esc 触发的 blur，跳过
      if (editingIsCancelling) {
        editingIsCancelling = false;
        return;
      }
      // 如果已经通过 Enter 提交了，跳过 blur 的二次提交
      if (editingIsCommitting) return;
      commitEditTag(chipElement, input.value.trim(), currentText);
    });
  }

  function commitEditTag(chipElement, newText, oldText) {
    editingIsCommitting = true;
    // 校验
    if (!newText || newText === oldText) {
      editingIsCommitting = false;
      cancelEditTag(chipElement, oldText);
      return;
    }

    // 检查重复（大小写不敏感，排除自身）
    var duplicate = false;
    for (var i = 0; i < allSuggestedTags.length; i++) {
      if (allSuggestedTags[i].toLowerCase() === newText.toLowerCase() && allSuggestedTags[i] !== oldText) {
        duplicate = true;
        break;
      }
    }
    if (duplicate) {
      editingIsCommitting = false;
      cancelEditTag(chipElement, oldText);
      return;
    }

    // 更新 allSuggestedTags
    var idx = allSuggestedTags.indexOf(oldText);
    if (idx !== -1) {
      allSuggestedTags[idx] = newText;
    }

    // 同步更新 selectedTags
    var selIdx = selectedTags.indexOf(oldText);
    if (selIdx !== -1) {
      selectedTags[selIdx] = newText;
    }

    // 刷新面板
    renderSuggestions();
    renderSelectedTags();
  }

  function cancelEditTag(chipElement, originalText) {
    editingIsCancelling = false;
    editingIsCommitting = false;
    renderSuggestions();
  }

  function startAddTag() {
    var row = App.$('#custom-tag-row');
    var input = App.$('#custom-tag-input');
    if (!row || !input) return;

    App.show('#custom-tag-row');
    input.value = '';
    input.focus();
  }

  function commitAddTag() {
    var input = App.$('#custom-tag-input');
    if (!input) return;
    var text = input.value.trim();

    // 校验
    if (!text || text.length > 20) return;

    // 检查重复（大小写不敏感）
    var duplicate = false;
    for (var i = 0; i < allSuggestedTags.length; i++) {
      if (allSuggestedTags[i].toLowerCase() === text.toLowerCase()) {
        duplicate = true;
        break;
      }
    }
    if (duplicate) return;

    // 添加到建议列表
    allSuggestedTags.push(text);

    // 自动选中
    selectedTags.push(text);

    // 隐藏输入行
    App.hide('#custom-tag-row');
    App.$('#custom-tag-input').value = '';

    // 刷新
    renderSuggestions();
    renderSelectedTags();
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
    updateModeToggleVisibility();
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
    updateModeToggleVisibility();
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
    updateModeToggleVisibility();
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
    updateModeToggleVisibility();
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

  App.getSearchMode = function () {
    return searchMode;
  };

  function updateModeToggleVisibility() {
    var toggle = App.$('#search-mode-toggle');
    if (!toggle) return;
    if (selectedTags.length >= 2) {
      App.show('#search-mode-toggle');
    } else {
      App.hide('#search-mode-toggle');
      if (searchMode === 'intersection') {
        searchMode = 'union';
        var unionBtn = App.$('.mode-btn[data-mode="union"]');
        var interBtn = App.$('.mode-btn[data-mode="intersection"]');
        if (unionBtn) {
          unionBtn.classList.add('mode-btn--active');
          unionBtn.setAttribute('aria-checked', 'true');
        }
        if (interBtn) {
          interBtn.classList.remove('mode-btn--active');
          interBtn.setAttribute('aria-checked', 'false');
        }
        localStorage.setItem('search-mode', 'union');
      }
    }
  }

  function initModeToggle() {
    var stored = localStorage.getItem('search-mode');
    if (stored === 'union' || stored === 'intersection') {
      searchMode = stored;
    } else {
      searchMode = 'union';
    }
    var unionBtn = App.$('.mode-btn[data-mode="union"]');
    var interBtn = App.$('.mode-btn[data-mode="intersection"]');
    if (searchMode === 'union') {
      if (unionBtn) {
        unionBtn.classList.add('mode-btn--active');
        unionBtn.setAttribute('aria-checked', 'true');
      }
      if (interBtn) {
        interBtn.classList.remove('mode-btn--active');
        interBtn.setAttribute('aria-checked', 'false');
      }
    } else {
      if (interBtn) {
        interBtn.classList.add('mode-btn--active');
        interBtn.setAttribute('aria-checked', 'true');
      }
      if (unionBtn) {
        unionBtn.classList.remove('mode-btn--active');
        unionBtn.setAttribute('aria-checked', 'false');
      }
    }
    // 绑定点击事件
    var modeBtns = App.$$('.mode-btn');
    modeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mode = this.getAttribute('data-mode');
        if (mode === searchMode) return;
        searchMode = mode;
        localStorage.setItem('search-mode', mode);
        modeBtns.forEach(function (b) {
          var isActive = b.getAttribute('data-mode') === mode;
          if (isActive) {
            b.classList.add('mode-btn--active');
            b.setAttribute('aria-checked', 'true');
          } else {
            b.classList.remove('mode-btn--active');
            b.setAttribute('aria-checked', 'false');
          }
        });
      });
    });
  }

  // 初始化自定义标签输入行的事件
  function initCustomTagRow() {
    var confirmBtn = App.$('#custom-tag-confirm');
    var cancelBtn = App.$('#custom-tag-cancel');
    var input = App.$('#custom-tag-input');

    if (confirmBtn) {
      confirmBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        commitAddTag();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        App.hide('#custom-tag-row');
        App.$('#custom-tag-input').value = '';
      });
    }

    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          commitAddTag();
        } else if (e.key === 'Escape') {
          App.hide('#custom-tag-row');
          input.value = '';
        }
        e.stopPropagation();
      });
    }
  }

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

    // 如果有标签正在编辑中，不关闭面板
    var editingChip = App.$('.suggest-tag--editing');
    if (editingChip) return;

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
      // 如果有标签正在编辑中，优先取消编辑
      var editingChip = App.$('.suggest-tag--editing');
      if (editingChip) {
        var dataTag = editingChip.getAttribute('data-tag');
        if (dataTag) {
          cancelEditTag(editingChip, dataTag);
          return;
        }
      }
      App.hide('#suggest-panel');
      var input = App.$('#search-input');
      if (input) input.blur();
    }
  }

  // ===== 初始化 =====
  function init() {
    initModeToggle();
    initCustomTagRow();
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
