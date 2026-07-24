# AGENTS.md — NotionNext 项目指南

> 本文件面向 AI 编码代理，假设读者对本项目一无所知。项目文档与代码注释以中文为主，本文件同样使用中文。

## 项目概览

NotionNext（当前版本 4.10.8，MIT 协议）是一个基于 **Next.js + Notion API** 的开源静态站点/博客系统。用户在 Notion 中维护文章、分类、标签、菜单和页面，NotionNext 通过 Notion API 拉取数据并将其发布为可访问、可搜索、可运营的独立网站（博客、文档站、作品集、导航站、产品官网等）。

- 主仓库：`https://github.com/notionnext-org/NotionNext`
- 在线文档站：`https://notionnext.tangly1024.com`（源码在本仓库 `docs/`）
- 渲染 Notion 内容使用 `react-notion-x`（7.10.0，通过 patch-package 打过补丁）

## 技术栈

- **框架**：Next.js 14（Pages Router，`pages/` 目录，非 App Router）+ React 18
- **样式**：Tailwind CSS 3 + PostCSS；少量 CSS Modules 与普通 CSS（`styles/`）
- **数据源**：Notion API（`notion-client`、`notion-utils`、`@notionhq/client`），渲染层为 `react-notion-x`
- **语言**：JavaScript 为主 + 部分 TypeScript（`middleware.ts`、`lib/site/`、`lib/db/notion/` 部分文件、`types/`）；`tsconfig.json` 开启 `strict` 且 `allowJs: true`
- **测试**：Jest 29 + @testing-library/react（jsdom 环境）
- **文档站**：VitePress（`.vitepress/` + `docs/`）
- **鉴权（可选）**：Clerk（`@clerk/nextjs`），仅在配置了 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` 时启用，保护 `/dashboard` 等路由
- **缓存**：内存 / 本地文件 / Redis（ioredis）/ Vercel KV 多层缓存，见 `lib/cache/`

## 环境要求与依赖管理

- **Node.js 22**（`package.json` engines 要求 `>=22 <25`；根目录 `.nvmrc` 与 `.node-version` 均为 `22`）。Node 20 无法安装当前依赖（`@ai-sdk/google` 要求 Node >=22）。
- **Yarn 1.22.22**（与 `package.json#packageManager` 一致）。
- 依赖管理铁律（来自 `DEVELOPMENT.md`）：
  - 只用 `yarn`，**禁止混用 `npm install` / `pnpm install`**；
  - 仓库只保留 `yarn.lock`，不允许提交 `package-lock.json`；
  - 修改依赖必须同时提交 `package.json` 和 `yarn.lock`；
  - CI 使用 `yarn install --frozen-lockfile` 校验锁文件一致性。
- `postinstall` 会自动执行 `patch-package`，`patches/` 目录下有 `notion-utils+7.10.0.patch` 和 `vitepress-chat+0.0.3.patch` 两个补丁，升级相关依赖时需同步维护。

## 常用命令

```bash
# 开发
yarn dev                 # 启动本地开发（Next.js dev，端口 3000）
yarn build               # 生产构建（BUILD_MODE=true）
yarn start               # 启动生产服务（需先 build）
yarn export              # 静态导出（BUILD_MODE=true EXPORT=true）并生成 sitemap
yarn bundle-report       # 构建并输出包体分析（ANALYZE=true）

# 质量
yarn lint                # Next.js ESLint 检查
yarn lint:fix            # 自动修复 ESLint 问题
yarn type-check          # tsc --noEmit 类型检查
yarn format              # Prettier 格式化全仓库
yarn format:check        # 检查格式
yarn quality             # 聚合质量检查脚本（scripts/quality-check.js）
yarn pre-commit          # lint:fix + format + type-check

# 测试
yarn test                # Jest 单元测试
yarn test:watch          # watch 模式
yarn test:coverage       # 覆盖率
yarn test:ci             # CI 模式（--ci --coverage --watchAll=false）

# 文档站
yarn docs:site:dev       # VitePress 本地预览
yarn docs:site:build     # 构建文档站（CI 中会执行）

# 性能
yarn perf:baseline       # 记录性能基线
yarn perf:compare        # 与基线比较
yarn perf:audit:themes   # 全主题 Lighthouse 审计（需先 yarn build && yarn start）
yarn perf:page-data      # 页面数据体积预算检查

# 其他
yarn clean               # 清理缓存与构建产物
yarn setup-hooks         # 安装 Git hooks（pre-commit / pre-push）
yarn deps:check-lockfile # 校验 yarn.lock 无漂移
yarn translate / translate:all / translate:check   # Notion 双语数据库翻译 CLI（见 scripts/translate/README.md）
```

完整脚本说明见 `DEVELOPMENT.md`。

## 项目结构与模块划分

```
NotionNext/
├── blog.config.js        # 全站主配置（聚合 conf/ 下所有配置，支持环境变量覆盖）
├── conf/                 # 拆分后的配置文件（评论、统计、字体、广告、AI、动画、插件等约 20 个）
├── next.config.js        # Next.js 配置：扫描 themes/、多语言 i18n、rewrites/redirects、构建前清理
├── middleware.ts         # Clerk 鉴权中间件 + UUID_REDIRECT 重定向
├── pages/                # Next.js Pages Router 路由
│   ├── index.js          # 首页
│   ├── [prefix]/         # 一级路径（文章 slug、分类、标签等）
│   │   └── [slug]/       # 二级路径文章
│   ├── archive|category|tag|search|page/  # 归档/分类/标签/搜索/分页
│   ├── api/              # API 路由（rss、revalidate、cache、subscribe、auth、claude 等）
│   ├── sign-in|sign-up|dashboard|auth/    # Clerk 相关页面
│   └── sitemap.xml.js    # 动态 sitemap
├── components/           # 全站共享 React 组件（约 100 个：评论、搜索、NotionPage、懒加载图片等）
├── themes/               # 25 个主题（见下节）
├── lib/                  # 核心业务逻辑
│   ├── db/notion/        # Notion 数据获取：页面、数据库、标签、分类、文章块、限流等
│   ├── db/SiteDataApi.js # 站点数据统一入口（getGlobalData / resolvePostProps 等）
│   ├── cache/            # 缓存层：memory / local_file / redis / vercel + 缓存管理器
│   ├── config.js         # siteConfig() 配置读取函数（见"配置系统"）
│   ├── global.js         # 全局状态（useGlobal，React Context）
│   ├── lang/             # 多语言文案
│   ├── plugins/          # 第三方插件逻辑（Algolia、AI 摘要、Mailchimp、字数统计等）
│   ├── site/             # 站点数据类型化封装（TS：site.api/service/types + adapters/processors）
│   ├── build/            # 构建期逻辑（静态路径、预取、构建环境）
│   ├── utils/            # 工具函数（日期、密码、RSS、sitemap、跳转等）
│   └── middleware/security.js  # 安全相关中间件逻辑
├── hooks/                # 自定义 React hooks
├── scripts/              # 构建/开发/质量/性能/翻译脚本
├── __tests__/            # Jest 测试（镜像 components/lib/scripts/themes 结构）
├── docs/                 # 文档权威来源（VitePress 站点源码；见"文档维护"）
├── styles/               # 全局 CSS
├── public/               # 静态资源（主题预览图、字体、第三方 vendor 脚本等）
├── patches/              # patch-package 补丁
├── cloudflare/           # Cloudflare Worker（Notion 图片代理）
├── functions/api/        # Pages Functions（docs-chat）
└── types/                # 全局 TypeScript 类型
```

### 路径别名

`tsconfig.json`、`jest.config.js` 与 webpack 均配置了 `@/` 指向仓库根：`@/components/*`、`@/lib/*`、`@/themes/*`、`@/pages/*`、`@/styles/*`、`@/conf/*` 等。`blog.config.js` 也以 `@/blog.config` 引入。

## 主题系统（核心机制）

- `themes/` 下每个目录即一个主题，目录名即主题名（共 25 个：`claude`、`commerce`、`endspace`、`example`、`fukasawa`、`fuwari`、`game`、`gitbook`、`heo`、`hexo`、`landing`、`magzine`、`matery`、`medium`、`movie`、`nav`、`next`、`nobelium`、`photo`、`plog`、`proxio`、`simple`、`starter`、`thoughtlite`、`typography`）。
- 当前主题由 `NEXT_PUBLIC_THEME` 环境变量 / `blog.config.js` 的 `THEME` 决定，Notion 配置表也可覆盖。
- 每个主题目录约定结构：
  - `index.js`：导出一组 `Layout*` 组件（`LayoutBase`、`LayoutIndex`、`LayoutPostList`、`LayoutSlug`、`LayoutSearch`、`LayoutArchive`、`Layout404`、`LayoutCategoryIndex`、`LayoutTagIndex` 等）和 `THEME_CONFIG`；
  - `config.js`：主题级默认配置（键名以主题大写名为前缀，如 `EXAMPLE_*`、`HEXO_*`）；
  - `style.js`：主题样式注入；
  - `components/`：主题私有组件。
- `themes/theme.js` 是运行时主题加载器：通过 `import('@/themes/<name>')` 动态加载布局，带兜底主题逻辑（fallback 到 `BLOG.THEME` 或 `example`）。`next.config.js` 构建时扫描 `themes/` 目录名注入 `publicRuntimeConfig.THEMES`。
- **新增或大改主题必须执行性能准入**（`DEVELOPMENT.md` 规定）：`yarn build && yarn start` 后另开终端跑 `yarn perf:audit:themes`，并把 `docs/performance/theme-audit-latest.md` 和 `.json` 一并提交。建议门槛：Performance ≥ 60、SEO ≥ 90、LCP ≤ 4000ms、CLS ≤ 0.1。
- 开发新主题时参考 `themes/example/`（结构最简单、注释最全的示例主题）。

## 配置系统

- 入口是 `blog.config.js`，它聚合 `conf/` 目录下约 20 个分类配置文件（评论、统计、图片、字体、代码块、动画、挂件、广告、AI、性能等）。
- 几乎所有配置项都支持环境变量覆盖，客户端可见的配置以 `NEXT_PUBLIC_` 前缀命名；完整列表见 `.env.example`（本地真实值放 `.env.local`，已 gitignore）。
- **配置读取优先级**（`lib/config.js` 的 `siteConfig(key, defaultVal, extendConfig)`）：
  1. Notion 站点中的 NotionConfig 配置表（`NOTION_CONFIG`）；
  2. 环境变量；
  3. `blog.config.js` / 各主题 `config.js`。
- 部分服务端专用键（`NEXT_REVALIDATE_SECOND`、`POSTS_PER_PAGE`、`PSEUDO_STATIC` 等）只能经 `extendConfig` 读取，见 `siteConfig` 内 switch 列表。
- 多语言：`NOTION_PAGE_ID` 支持 `xxx,zh:xxx,en:xxx` 逗号格式配置多语言页面，`next.config.js` 据此生成 i18n locales 与重写规则；文案在 `lib/lang/`。

## 数据流与运行时架构

1. 构建/请求时 `lib/db/SiteDataApi.js` 调用 `lib/db/notion/` 从 Notion 拉取站点全量数据（文章、分类、标签、菜单、站点信息、NotionConfig 配置表）。
2. 数据经 `lib/cache/` 缓存（支持内存、文件、Redis、Vercel KV，`ENABLE_CACHE` 控制）；构建期有 Notion 数据缓存与预取机制（`.next/cache/notion/`，相关环境变量见 `.env.example` 的 BUILD_PREFETCH_* / NOTION_BUILD_*）。
3. 页面使用 **ISR**：`NEXT_PUBLIC_REVALIDATE_SECOND`（默认 60 秒）控制静态期；配置 `REVALIDATION_TOKEN` 后可通过 `POST /api/revalidate` 立即刷新缓存。
4. 前端通过 `lib/global.js` 的 `useGlobal()` Context 分发站点数据与 `NOTION_CONFIG`，页面组件再交给 `themes/theme.js` 的动态布局渲染。
5. `middleware.ts` 在边缘层处理可选的 Clerk 鉴权（`/dashboard` 等路由）与 `UUID_REDIRECT`（Notion UUID → slug 308 重定向）。

## 代码风格

- **Prettier**（`.prettierrc`）：单引号、**不加分号**、无尾逗号、`arrowParens: avoid`、行宽 80、JSX 单引号、`jsxBracketSameLine: true`。
- **ESLint**（`.eslintrc.js`）：`next` + `react` + `@typescript-eslint` 推荐规则 + `prettier`；`react-hooks/rules-of-hooks` 为 error；对 `*.js` 文件放宽了 TS 严格规则（`no-unsafe-*`、`no-explicit-any` 等关闭）。
- **TypeScript**：`strict: true`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`；新代码注意这些严格项。
- 命名规范（`DEVELOPMENT.md`）：组件 PascalCase、文件 kebab-case、变量/函数 camelCase、常量 UPPER_SNAKE_CASE。
- 提交信息使用 **Conventional Commits**：`feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert(scope): 描述`。
- Git hooks 通过 `yarn setup-hooks` 安装（pre-commit 跑 lint/format/type-check）。
- 注释与文档以中文书写，与现有代码保持一致；仓库内文档（README、docs/）遵循项目现有中文排版风格。

## 测试

- 框架：Jest 29 + jest-environment-jsdom + @testing-library/react / jest-dom / user-event。
- 测试位置：`__tests__/` 目录（镜像 `components/`、`lib/`、`scripts/`、`themes/` 结构）以及任意 `*.test.*` / `*.spec.*` 文件。
- 配置文件：`jest.config.js`（含 `@/` 别名映射）、`jest.setup.js`、`jest.env.js`；测试超时 10s，CI 输出 JUnit 报告到 `test-results/`。
- 运行：`yarn test`；CI 使用 `yarn test --passWithNoTests`。
- 覆盖率默认不收集（`collectCoverage: false`），`yarn test:coverage` 时收集 `components/`、`lib/`、`pages/`（排除 `pages/api`），当前**没有强制的覆盖率门槛**（`coverageThreshold: {}`）。

## CI 与部署

### CI（`.github/workflows/ci.yml`，PR 与 main 推送触发）

四个并行 job：
1. `yarn lint` + `yarn type-check`；
2. `yarn test --passWithNoTests`；
3. `yarn deps:check-lockfile`（锁文件一致性）；
4. `yarn docs:site:build`（VitePress 文档站构建）。

其他工作流：CodeQL 分析、Docker 镜像发布到 GHCR、文档站部署、版本号自动 bump 等。

### 部署方式（详见 `DEPLOYMENT.md`）

- **Vercel（推荐）**：连接仓库自动部署，至少配置 `NOTION_PAGE_ID` 环境变量；平台 Node 版本需设为 22。
- **Netlify**：`netlify.toml` 已配置（`@netlify/plugin-nextjs`，Node 22）。
- **Docker**：`Dockerfile` 多阶段构建（node:22-alpine，`NEXT_BUILD_STANDALONE=true` 输出 standalone），支持 `NOTION_PAGE_ID` / `NEXT_PUBLIC_THEME` 构建参数，暴露 3000 端口。
- **PM2 自托管**：`ecosystem.config.js`（`yarn build && pm2 start ecosystem.config.js`，默认 80 端口）。
- **Cloudflare Pages / 静态导出**：`yarn export`；`cloudflare/notion-image-proxy/` 提供 Notion 图片代理 Worker。
- 构建前 `next.config.js` 会自动清理 `public/sitemap.xml`、`public/rss/*` 等遗留产物并准备 Notion 构建会话缓存——这是有意行为，不要误删这段逻辑。

## 文档维护

- 自 2026 年起，**`docs/` 目录是文档权威来源**（取代 Notion 托管的旧手册），详见 `docs/DOCUMENTATION_POLICY.md`：
  - 用户教程 → `docs/user-guide/`；主题使用说明 → `docs/user-guide/themes/<id>.md`；
  - 架构/贡献/主题实现细节 → `docs/developer/`、`docs/developer/themes/`；
  - 修改文档需同步更新 `docs/user-guide/ARTICLE_INDEX.md` 等索引；
  - 不要把个人 `.env`、私有 ID 写进文档示例。
- 改动功能时同步更新相关文档；文档站用 `yarn docs:site:build` 验证可构建。

## 安全注意事项

- **绝不提交密钥**：`.env.local` 已 gitignore；`.env.example` 只作模板。敏感服务端密钥（`ALGOLIA_ADMIN_APP_KEY`、`SUPABASE_*`、`MAILCHIMP_API_KEY`、`NOTION_TOKEN`、`REVALIDATION_TOKEN`、Clerk 密钥等）只用非 `NEXT_PUBLIC_` 变量，避免泄露到客户端 bundle。
- `next.config.js` 中 `images.remotePatterns` 放开了所有 http/https 远程主机（站长外链图源不可控的有意设计），且 `dangerouslyAllowSVG: true` 并配了 CSP sandbox——改动图片配置时注意维持该 CSP。
- 安全响应头（X-Frame-Options、CSP 等）在 `next.config.js` 中默认注释关闭以保证博客兼容性，全站 CORS 为 `*`——这是上游有意取舍，收紧前需评估对评论/统计等第三方嵌入的影响。
- 仓库根有 `SECURITY.md`（漏洞报告流程）；CI 有 CodeQL 静态分析。
- 文章密码功能：密码经 SHA-256（兼容旧 MD5）哈希比对，明文仅存用户浏览器 localStorage，见 `lib/utils/password.js` 与 `pages/[prefix]/index.js`。

## 给 AI 代理的额外提示

- 这是 Pages Router 项目，不要引入 App Router（`app/` 目录）写法。
- 修改主题行为时优先改动对应 `themes/<name>/` 目录，避免影响其他主题；全站共享逻辑放 `components/` 或 `lib/`。
- 改配置项时同时考虑三处：环境变量名、`conf/` 或 `blog.config.js` 默认值、以及文档（`docs/user-guide/reference/` 的配置索引与 `conf/` 同步维护）。
- 提交前至少跑 `yarn lint`、`yarn type-check`、`yarn test`；涉及主题渲染的改动补跑对应主题的测试与（大改时）性能审计。
- 根目录还有 `CONTRIBUTING.md` / `CONTRIBUTING.zh-CN.md`、`GOVERNANCE.md`、`MAINTAINERS.md`、`OPTIMIZATION_SUMMARY.md` 等治理与历史文档，涉及贡献流程时参考之。
