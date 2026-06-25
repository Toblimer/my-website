'use strict';

(function () {
  var App = window.App;

  // API 基础 URL：线上用相对路径，本地开发用 Vercel 生产 API
  var API_BASE = (function () {
    var host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')) {
      return 'https://my-website-two-fawn-12.vercel.app';
    }
    return '';
  })();
  var cache = new Map();
  var CACHE_TTL = 5 * 60 * 1000;

  App.searchImages = async function (query, page, mode) {
    if (page === undefined) page = 1;
    if (mode === undefined) mode = 'union';
    var cacheKey = query + '::' + page + '::' + mode;
    var cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    var params = new URLSearchParams({
      q: query,
      page: String(page),
      perPage: '20',
    });
    if (mode) params.set('mode', mode);
    var response = await fetch(API_BASE + '/api/search?' + params.toString());

    if (!response.ok) {
      var errorData = await response.json().catch(function () { return {}; });
      throw new Error(errorData.error || '请求失败 (' + response.status + ')');
    }

    var data = await response.json();
    cache.set(cacheKey, { data: data, timestamp: Date.now() });
    return data;
  };
})();
