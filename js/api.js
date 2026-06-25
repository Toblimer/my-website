'use strict';

(function () {
  var App = window.App;

  // 简单内存缓存，5 分钟过期
  var cache = new Map();
  var CACHE_TTL = 5 * 60 * 1000;

  App.searchImages = async function (query, page) {
    if (page === undefined) page = 1;
    var cacheKey = query + '::' + page;
    var cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    var params = new URLSearchParams({
      q: query,
      page: String(page),
      perPage: '20',
    });
    var response = await fetch('/api/search?' + params.toString());

    if (!response.ok) {
      var errorData = await response.json().catch(function () { return {}; });
      throw new Error(errorData.error || '请求失败 (' + response.status + ')');
    }

    var data = await response.json();
    cache.set(cacheKey, { data: data, timestamp: Date.now() });
    return data;
  };
})();
