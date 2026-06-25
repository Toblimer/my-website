# OpenWolf Agent Prompt 格式规范

> 用于 Claude 规划新功能后，生成可直接投喂给 OpenWolf（或 OpenClaw）执行的 Agent Prompt。

---

## Prompt 结构模板

```markdown
## 任务
[一句话描述要做什么]

## 背景（给 Agent 建立上下文）
- 项目名：my-website（位于 C:\Users\Runzhe Tan\Projects\my-website\）
- 技术栈：纯 HTML/CSS/JS 前端 + Vercel Serverless Function 后端
- 架构约定：通过 window.App 全局对象共享状态，IIFE 模块，零依赖

## 具体要做的事

### 文件 N：`path/to/file` — [操作类型]

[文件代码/改动说明]

## 重要约束
- ⚠️ 不要修改 [已有文件]
- ⚠️ 每个 JS 文件以 'use strict'; 开头，IIFE 包裹
- ⚠️ 通过 window.App 共享状态和方法
- ⚠️ 所有设计 Token 来自 CSS :root 变量
- ⚠️ 缩进 2 空格

## 验收标准
- [ ] 标准 1
- [ ] 标准 2

## 产出物
请展示以下文件的完整内容：
1. `file1.js`
2. `file2.js`
```

---

## 关键信息速查（填入 Prompt 背景）

- **项目路径**：`C:\Users\Runzhe Tan\Projects\my-website\`
- **线上 URL**：`https://my-website-two-fawn-12.vercel.app/`
- **GitHub**：`https://github.com/Toblimer/my-website`
- **设计 Token**：`--color-primary`, `--color-bg`, `--color-text`, `--color-border`, `--color-muted`, `--color-bg-card`, `--color-bg-overlay`, `--color-bg-skeleton`, `--radius-sm/md/lg`, `--shadow-sm/md/lg`, `--spacing-xs/sm/md/lg/xl/2xl`
- **暗色模式**：通过 `[data-theme="dark"]` 覆盖 CSS 变量
- **JS 加载顺序**：utils → api → suggest → search → gallery → modal → main
- **App 全局对象**：`App.state = { query, page, perPage:20, total, results, isLoading, hasMore }`
- **API 端点**：`GET /api/search?q=xxx&page=1&perPage=20` · `GET /api/suggest?q=xxx`
- **Vercel 环境变量**：PEXELS_API_KEY, PIXABAY_API_KEY, DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL（已配置）

---

## 历史 Prompt 参考

### 批次① — 后端 API（`api/search.js` + `vercel.json` + `.env.example`）
### 批次② — 前端 HTML + CSS（`index.html` 改造 + `style.css` 扩展）
### 批次③ — 前端 JS 模块（6 个文件：utils/api/search/gallery/modal/main）
### Phase 4 — 搜索建议标签（`api/suggest.js` + `js/suggest.js` + HTML/CSS 修改）

> 完整 Prompt 原文请参见 JSONL 转录文件：
> `C:\Users\Runzhe Tan\.claude\projects\C--Users-Runzhe-Tan-AI-Coding\834781b7-f291-47c6-8f53-b05c56a685e7.jsonl`
