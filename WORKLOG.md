# 📋 工作日志 — my-website

> 最后更新：2026-06-25
> 当前阶段：自定义子话题标签功能 ✅ — 准备下一功能规划
>
> 🌐 线上地址：https://my-website-two-fawn-12.vercel.app/
> 📦 GitHub：https://github.com/Toblimer/my-website
> 📂 本地路径：`C:\Users\Runzhe Tan\Projects\my-website\`

---

# ⚠️ 给新会话 Claude 的第一条指令 — 必读

**你必须严格遵守以下工作流，不得跳过任何步骤。**

## 核心规则：每次实现新功能必须走完整流程

```
用户提需求 → 桌面版 Claude 规划 + 输出 Agent Prompt → Claude Code 写代码 → 桌面版 Claude 审查 → 通过后 commit push → 更新本文件
```

| 步骤 | 负责人 | 动作 |
|------|--------|------|
| ① 需求理解 | 桌面版 Claude | 分析需求，必要时进入 Plan Mode 设计方案 |
| ② 输出 Prompt | 桌面版 Claude | **输出可直接投喂给 Claude Code 的完整 Agent Prompt**（格式参见 `PROMPT_FORMAT.md`） |
| ③ 代码开发 | Claude Code | 接收 Prompt 后在本地直接编写代码 |
| ④ 代码审查 | 桌面版 Claude | 审查 Claude Code 的产出，逐项对照验收标准，发现 Bug 要修复 |
| ⑤ 发布部署 | 桌面版 Claude | `git add` + `git commit` + `git push`，写清 commit message |
| ⑥ 更新日志 | 桌面版 Claude | 更新本文件，记录本批次的所有内容 |

> ⚠️ **工作流于 2026-06-25 变更**：代码开发角色从 OpenClaw+DeepSeek 切换为 Claude Code。桌面版 Claude 仍负责规划、审查和部署。

## 绝对禁止的行为

- ❌ **Claude Code 禁止跳过 Prompt 直接开发**（必须等桌面版 Claude 输出 Prompt 后才动手）
- ❌ **禁止不更新 WORKLOG.md 就结束会话**（新会话 Claude 会丢失上下文）
- ❌ **禁止 push 前不审查**（桌面版 Claude 必须逐项检查验收标准）

## 何时可以不走完整流程（例外）

- 修复 Bug（如"线上搜索返回空结果"类问题）→ Claude Code 直接查代码、定位、修复
- 单文件小改动（如改个颜色、加个样式）→ Claude Code 直接改
- 用户明确说"这个你自己改就行" → Claude Code 直接改

---

## 工作流参考

### Prompt 输出格式

参见项目中的 [`PROMPT_FORMAT.md`](./PROMPT_FORMAT.md)，包含完整的模板和关键信息速查表。

### 方案文档

完整技术方案：`C:\Users\Runzhe Tan\.claude\plans\iterative-munching-wind.md`

### 每次会话结束前必须做的事

1. `git push` 所有改动
2. 更新本文件的"会话记录"和"项目当前状态"
3. 如果有新的功能建议，更新"功能清单"

---

## 项目当前状态

| 维度 | 状态 |
|------|------|
| 本地开发 | ✅ |
| GitHub | ✅ `Toblimer/my-website` |
| 线上部署 | ✅ `my-website-two-fawn-12.vercel.app` |
| 技术栈 | 纯 HTML/CSS/JS + Vercel Serverless Function |
| 分支 | `main` |
| 最新 Commit | `c5a3e35 📝 Phase 6 审查完成 + 更新工作日志` |
| Claude Code | ✅ 已配置 `.claude/rules/` + `.claude/settings.json` |
| Vercel 环境变量 | ✅ PEXELS_API_KEY, PIXABAY_API_KEY, DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL（全部已配置） |

---

## 功能清单

| 功能 | 状态 |
|------|------|
| 🏗 项目脚手架 | ✅ |
| 📦 GitHub 仓库 | ✅ |
| 🌐 Vercel 部署 | ✅ |
| 🌙 暗色模式切换 | ✅ |
| 🤖 AI 图片检索 API（后端） | ✅ |
| 🖼 前端搜索界面（HTML + CSS） | ✅ |
| 🖼 前端交互逻辑（JS） | ✅ |
| 🏷 搜索建议标签（AI 生成子话题） | ✅ |
| 🔀 交集/并集搜索模式 | ✅ |
| ✏️ 标签编辑/自定义标签 | ✅ |
| 📊 高级筛选（颜色/尺寸/方向） | ⏳ |
| 📝 搜索历史管理 | ⏳ |
| ❤️ 用户收藏功能 | ⏳ |

---

## 关键架构速查

### 文件加载顺序
```
index.html
  <script> utils.js → api.js → suggest.js → search.js → gallery.js → modal.js → main.js
```

### window.App 全局对象
```javascript
App.state = { query, page, perPage:20, total, results, isLoading, hasMore }
App.$ / App.$$ / App.show / App.hide / App.debounce / App.escapeHTML
App.searchImages(q, page) / App.handleSearch(event)
App.renderResults(results) / App.openModal(item) / App.closeModal()
App.getCombinedQuery() / App.hideSuggestPanel()
```

### 设计 Token（:root 变量）
`--color-primary` `--color-bg` `--color-text` `--color-border` `--color-muted`
`--color-bg-card` `--color-bg-overlay` `--color-bg-skeleton`
`--radius-sm/md/lg` `--shadow-sm/md/lg` `--spacing-xs/sm/md/lg/xl/2xl`

### API 端点
- `GET /api/search?q=xxx&page=1&perPage=20` → 聚合搜索
- `GET /api/suggest?q=xxx` → 搜索建议标签

### 本地开发
- Python HTTP server 端口 8084（无 API），`api.js` 的 `API_BASE` 自动指向生产 URL
- 需要测试 API 时用 `vercel dev` 并加载 `.env`

---

## 会话记录

### 2026-06-24 · 会话 #1

| # | 环节 | 产出 | 结论 |
|---|------|------|------|
| 规划 #1 | Claude | 项目架构设计 + Agent Prompt v1 | — |
| 开发 #1 | OpenClaw+DeepSeek | 项目脚手架搭建 | — |
| 审查 #1 | Claude | 验证 8 个文件 | ✅ 6/6 |
| 规划 #2 | Claude | Prompt v2（GitHub + Vercel） | — |
| 开发 #2 | OpenClaw+DeepSeek | GitHub 仓库 + Vercel 部署 | — |
| 审查 #2 | Claude | 全网链路验证 | ✅ 6/6 |
| 规划 #3 | Claude | Prompt v3（暗色模式） | — |
| 开发 #3 | OpenClaw+DeepSeek | 暗色模式切换 | — |
| 审查 #3 | Claude | 亮/暗切换 + 持久化 + 系统偏好 | ✅ 8/8 |

### 2026-06-25 · 会话 #3（Phase 5：交集/并集搜索模式）

| # | 环节 | 产出 | 结论 |
|---|------|------|------|
| 规划 | Claude | 需求分析 + Agent Prompt（6 个文件改动方案） | — |
| 开发 | OpenClaw+DeepSeek | index.html + style.css + suggest.js + api.js + search.js + api/search.js | 发现 2 个 Bug |
| 审查 | Claude | 逐项验收标准检查 + Bug 修复 | ✅ 13/13 |
| 修复 | Claude | Bug 1: toggleTag() 中 updateModeToggleVisibility 调用时机错误；Bug 2: clearSelectedTags() 未更新切换器 | ✅ |
| 部署 | Claude | commit `9a12049` + push | ✅ |

### 2026-06-25 · 会话 #4（Phase 6：自定义编辑/添加子话题标签）

| # | 环节 | 产出 | 结论 |
|---|------|------|------|
| 规划 | 桌面版 Claude | 需求分析 + Agent Prompt（3 个文件改动方案） | — |
| 开发 | Claude Code | index.html + style.css + suggest.js | 发现 3 项需修复 |
| 审查 | 桌面版 Claude | 逐项验收标准检查 + Bug 修复 + commit push | ✅ |

审查发现并修复的问题：
| # | 问题 | 严重度 | 修复方案 |
|---|------|:---:|------|
| 1 | Esc 取消编辑被 blur 事件覆盖，编辑仍被保存 | **高** | 新增 `editingIsCancelling` 标志位，blur 中检测跳过 |
| 2 | Enter 提交后 renderSuggestions 触发 blur，导致二次 commit | **中** | 新增 `editingIsCommitting` 标志位，blur 中检测跳过 |
| 3 | CSS 中 `.suggest-tag` 重复定义两次（原有 + 新增的 `position:relative`）| **低** | 合并到原有 `.suggest-tag` 块中 |
| 4 | 移动端编辑按钮无法可见（纯 hover 触发）| **中** | 在 `@media (max-width: 480px)` 中设为始终显示 |

部署：commit `ecdd758` + push

### ⚠️ 工作流执行记录

| 日期 | 批次 | 是否遵循标准流程 | 备注 |
|------|------|:---:|------|
| 06-24 | ①~③ | ✅ | Claude 出 Prompt → OpenClaw 执行 → Claude 审查 |
| 06-25 | Bug 修复 | ⏭️ 跳过 | Bug 修复属于例外，Claude 直接修 |
| 06-25 | Phase 4 | ❌ | Claude 跳过了 Prompt 环节直接写代码 |
| 06-25 | Phase 5 | ✅ | Claude 出 Prompt → OpenClaw 执行 → Claude 审查修复 → commit push |
| 06-25 | Phase 6 | ✅ | 桌面版 Claude 出 Prompt → Claude Code 开发 → 桌面版 Claude 审查修复 → commit push |

> **经验教训**：
> - Phase 5：OpenClaw 产出的代码整体正确，但 2 处细节仍需人工审查发现。
> - Phase 6：Claude Code 产出的代码 Bug 更多（blur/Enter/Esc 竞态），核心原因是 `renderSuggestions()` 用 `innerHTML = ''` 清空 DOM 会触发 input 的 blur 事件。这是一个经典的 DOM 事件时序问题，AI 容易忽视。修复方案是加标志位锁（`editingIsCancelling` / `editingIsCommitting`）。
> - AI 写的代码仍然需要人工审查，特别是涉及 DOM 事件时序的场景。

---

## 下一步

- 规划下一功能（按标准流程：Claude 出 Prompt → Claude Code 开发 → Claude 审查）
- 候选功能：高级筛选 / 搜索历史 / 收藏夹
