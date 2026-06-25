/**
 * AI 图片检索 API
 * Vercel Serverless Function
 * 
 * 使用 DeepSeek V4 改写中文查询为英文搜索短语，
 * 并行搜索 Pexels + Pixabay 图片 API 并聚合返回。
 * 
 * 零 npm 依赖，仅使用 Node.js 内置模块。
 */

const DEFAULT_DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

export default async function handler(req, res) {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 只接受 GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 解析参数
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.status(400).json({ error: '请输入搜索关键词' });
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const perPage = Math.min(40, Math.max(1, parseInt(req.query.perPage, 10) || 20));

  try {
    // 第 1 步：AI 查询改写
    const phrases = await rewriteQuery(q);

    // 第 2 步：并行搜索（一个短语一个 API，交替分配保证多样性）
    const searchPromises = phrases.map((phrase, index) => {
      // 奇数索引优先用 Pixabay，偶数索引优先用 Pexels，均匀分配
      if (index % 2 === 0) {
        return Promise.allSettled([
          searchPexels(phrase, page, Math.min(perPage, 20)),
          searchPixabay(phrase, page, perPage),
        ]);
      } else {
        return Promise.allSettled([
          searchPixabay(phrase, page, perPage),
          searchPexels(phrase, page, Math.min(perPage, 20)),
        ]);
      }
    });

    const settledResults = await Promise.allSettled(searchPromises);
    const settledFlat = settledResults.flatMap((r) => {
      if (r.status === 'fulfilled') return r.value;
      console.error('[search] 搜索批次失败:', r.reason);
      return [];
    });

    // 展平所有结果
    const allResults = settledFlat.flatMap((r) => {
      if (r.status === 'fulfilled') return r.results || [];
      console.error('[search] 单个 API 搜索失败:', r.reason);
      return [];
    });

    // 去重（基于 id）
    const seen = new Set();
    const uniqueResults = [];
    for (const item of allResults) {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id);
        uniqueResults.push(item);
      }
    }

    // Fisher-Yates 洗牌
    shuffle(uniqueResults);

    // 截取前 perPage 个
    const sliced = uniqueResults.slice(0, perPage);

    // 计算 total（取各源最大 total 值）
    const totals = settledFlat.flatMap((r) => {
      if (r.status === 'fulfilled') return [r.total || 0];
      return [];
    });
    const total = totals.length > 0 ? Math.max(...totals) : 0;

    return res.json({
      total,
      page,
      perPage,
      queryInterpretation: phrases.join(', '),
      results: sliced,
    });
  } catch (err) {
    console.error('[search] 整体异常:', err);
    return res.status(500).json({ error: '服务器内部错误，请稍后重试' });
  }
}

/**
 * 调用 DeepSeek V4 API 将自然语言查询改写为英文搜索短语
 */
async function rewriteQuery(query) {
  const baseUrl = process.env.DEEPSEEK_BASE_URL || DEFAULT_DEEPSEEK_BASE_URL;
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    console.warn('[rewrite] DEEPSEEK_API_KEY 未配置，使用原始查询词作为搜索短语');
    return [query];
  }

  const systemPrompt =
    'You are a search query optimizer. Given a user\'s image description in any language, ' +
    'rewrite it into 3-5 concise English keyword phrases optimized for stock photo APIs (Pexels, Pixabay). ' +
    'Each phrase should be 2-5 words. Return ONLY a JSON array of strings, no explanation. ' +
    'Example input: "绿色植被，高清" → output: ["green vegetation HD", "lush forest high resolution", "nature greenery sharp", "dense foliage wallpaper"]';

  const userPrompt = query;

  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error(`[rewrite] DeepSeek API 返回 ${response.status}: ${await response.text()}`);
      return [query];
    }

    const data = await response.json();
    let content = '';

    if (data.choices && data.choices[0] && data.choices[0].message) {
      content = data.choices[0].message.content.trim();
    } else {
      console.warn('[rewrite] DeepSeek 响应格式异常，使用原始查询词');
      return [query];
    }

    // 尝试解析 JSON
    let parsed = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      // 尝试用正则提取 JSON 数组
      const match = content.match(/\[[\s\S]*?\]/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          // 解析失败
        }
      }
    }

    if (Array.isArray(parsed) && parsed.length > 0) {
      // 始终在最前面追加原始查询词
      const result = [query, ...parsed.filter((p) => typeof p === 'string' && p.trim())];
      // 去重（保留第一个出现的）
      const seen = new Set();
      return result.filter((p) => {
        const lower = p.toLowerCase().trim();
        if (seen.has(lower)) return false;
        seen.add(lower);
        return true;
      });
    }

    console.warn('[rewrite] 未能解析 LLM 返回的有效短语，使用原始查询词');
    return [query];
  } catch (err) {
    console.error('[rewrite] DeepSeek 调用异常:', err.message);
    return [query];
  }
}

/**
 * 搜索 Pexels API
 */
async function searchPexels(phrase, page, perPage) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    console.warn('[pexels] PEXELS_API_KEY 未配置');
    return { total: 0, results: [] };
  }

  const url = new URL('https://api.pexels.com/v1/search');
  url.searchParams.set('query', phrase);
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('page', String(page));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Pexels API ${response.status}: ${body}`);
  }

  const data = await response.json();

  const results = (data.photos || []).map((photo) => ({
    id: `pexels_${photo.id}`,
    source: 'pexels',
    thumbnail: photo.src.small || '',
    medium: photo.src.medium || '',
    full: photo.src.original || '',
    width: photo.width || 0,
    height: photo.height || 0,
    alt: photo.alt || '',
    photographer: photo.photographer || '',
    photographerUrl: photo.photographer_url || '',
    sourceUrl: photo.url || '',
    color: photo.avg_color || null,
  }));

  return {
    total: data.total_results || 0,
    results,
  };
}

/**
 * 搜索 Pixabay API
 */
async function searchPixabay(phrase, page, perPage) {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    console.warn('[pixabay] PIXABAY_API_KEY 未配置');
    return { total: 0, results: [] };
  }

  const url = new URL('https://pixabay.com/api/');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('q', phrase);
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('page', String(page));
  url.searchParams.set('image_type', 'photo');
  url.searchParams.set('safesearch', 'true');

  const response = await fetch(url.toString());

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Pixabay API ${response.status}: ${body}`);
  }

  const data = await response.json();

  const results = (data.hits || []).map((hit) => ({
    id: `pixabay_${hit.id}`,
    source: 'pixabay',
    thumbnail: hit.previewURL || '',
    medium: hit.webformatURL || '',
    full: hit.largeImageURL || '',
    width: hit.imageWidth || 0,
    height: hit.imageHeight || 0,
    alt: hit.tags || '',
    photographer: hit.user || '',
    photographerUrl: `https://pixabay.com/users/${encodeURIComponent(hit.user || '')}/`,
    sourceUrl: hit.pageURL || '',
    color: null,
  }));

  return {
    total: data.totalHits || 0,
    results,
  };
}

/**
 * Fisher-Yates 洗牌算法
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
