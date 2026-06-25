/**
 * AI 搜索建议 API
 * Vercel Serverless Function
 *
 * 根据用户输入的部分搜索词，使用 DeepSeek V4 生成相关子话题标签，
 * 帮助用户更精确地细化搜索。
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
    return res.status(400).json({ error: '请输入搜索词' });
  }

  // 输入不足 2 字符，不发 API 请求
  if (q.length < 2) {
    return res.json({ query: q, tags: [] });
  }

  try {
    const tags = await generateSuggestions(q);
    return res.json({ query: q, tags });
  } catch (err) {
    console.error('[suggest] 整体异常:', err);
    return res.json({ query: q, tags: [] });
  }
}

/**
 * 调用 DeepSeek V4 生成子话题建议标签
 */
async function generateSuggestions(query) {
  const baseUrl = process.env.DEEPSEEK_BASE_URL || DEFAULT_DEEPSEEK_BASE_URL;
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    console.warn('[suggest] DEEPSEEK_API_KEY 未配置');
    return [];
  }

  const systemPrompt =
    'You are a search suggestion engine for a stock image search website. ' +
    'Given a user\'s partial image search query (in any language), generate 4-8 related, more specific ' +
    'sub-topic tags that help the user refine their search.\n\n' +
    'Rules:\n' +
    '- Each tag must be 1-4 words describing a specific sub-topic, style, or aspect of the query.\n' +
    '- Tags should be self-contained: the user may select several to combine with their original query.\n' +
    '- Include diverse suggestions: some concrete objects/scenes, some stylistic directions.\n' +
    '- Return ONLY a JSON array of strings, no explanation, no markdown.\n\n' +
    'Example input: "中国美学" → output: ["唐朝", "灯笼", "书画", "人像", "宋代瓷器", "水墨山水", "建筑", "汉服"]\n' +
    'Example input: "sunset" → output: ["ocean beach", "mountain silhouette", "city skyline", "tropical palm", "golden hour", "minimalist", "desert dunes"]';

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
          { role: 'user', content: query },
        ],
        temperature: 0.8,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      console.error(`[suggest] DeepSeek API 返回 ${response.status}: ${await response.text()}`);
      return [];
    }

    const data = await response.json();
    let content = '';

    if (data.choices && data.choices[0] && data.choices[0].message) {
      content = data.choices[0].message.content.trim();
    } else {
      console.warn('[suggest] DeepSeek 响应格式异常');
      return [];
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
      // 过滤有效标签，去重，限制数量
      const seen = new Set();
      return parsed
        .filter((t) => typeof t === 'string' && t.trim().length > 0)
        .map((t) => t.trim())
        .filter((t) => {
          const lower = t.toLowerCase();
          if (seen.has(lower) || lower === query.toLowerCase()) return false;
          seen.add(lower);
          return true;
        })
        .slice(0, 8);
    }

    console.warn('[suggest] 未能解析 LLM 返回的有效标签');
    return [];
  } catch (err) {
    console.error('[suggest] DeepSeek 调用异常:', err.message);
    return [];
  }
}
