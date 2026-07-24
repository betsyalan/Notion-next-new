# next 主题「经典书院风」视觉改造实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 通过纯 CSS 覆盖层将 `themes/next` 主题默认视觉改造为「经典书院风」(浅色+配套暗色),不改任何组件 JS、布局结构与 Notion 数据流。

**Architecture:** 新增配置项 `NEXT_STYLE_EDITORIAL`(默认 `true`);`themes/next/style.js` 在其为 true 时额外渲染一段以 `#theme-next` 为作用域根的覆盖 CSS(设计令牌 + 各区域覆盖规则 + `.dark #theme-next` 暗色映射)。组件零改动,回退只需关闭配置。

**Tech Stack:** Next.js 14 Pages Router、React 18、styled-jsx(`<style jsx global>`)、Tailwind CSS 3、Jest 29 + react-dom/server。

## Global Constraints

- 设计权威来源:`docs/superpowers/specs/2026-07-24-next-theme-editorial-style-design.md`;视觉基准:`public/design-preview/style-next-editorial.html`。
- 不改 `themes/next/index.js` 的 `Layout*` 导出、组件 props、目录结构;不改 `lib/`、`pages/`、其他主题。
- `NotionPage` 正文渲染样式不动。
- 覆盖 CSS 一律以 `#theme-next`(暗色 `.dark #theme-next`)为作用域根;`!important` 仅限颜色/字体,禁止用于布局属性。
- 暗色类 `.dark` 挂在 `<html>` 上(`lib/global.js`),`.dark #theme-next` 选择器有效;Tailwind `darkMode: 'class'`。
- 配置读取:`siteConfig('NEXT_STYLE_EDITORIAL', null, CONFIG)` 可能返回 boolean 或字符串,判断用 `v === true || v === 'true'`。
- 代码风格:Prettier(单引号、无分号、行宽 80);提交信息 Conventional Commits 中文描述;**只提交本地,禁止 push**。
- 浅色令牌:--ink:#1a202c / --blue:#2f6fde / --navy:#1E3A5F / --bronze:#C08A3E / --paper:#f7f1e6 / --gray:#6b7280 / --line:#e8e6e1 / --bg:#fbfaf8。
- 暗色令牌:--bg:#141210 / --ink:#e8e2d6 / --gray:#9a917f / --line:#332e26 / --blue:#7aa2f0 / --navy:#c9b98f / --paper:#1d1a16(--bronze 不变)。
- 字体:`@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&display=swap');` + `--serif:"Noto Serif SC","Songti SC","STSong",serif`。

---

### Task 1: 配置项与 style.js 条件接线(令牌 + 字体)

**Files:**
- Modify: `themes/next/config.js`(新增 1 行配置)
- Modify: `themes/next/style.js`(条件渲染覆盖层骨架)
- Test: `__tests__/themes/next/style.test.js`(新建)

**Interfaces:**
- Consumes: 现有 `siteConfig(key, defaultVal, extendConfig)`(`@/lib/config`)、`themes/next/config.js` 的 `CONFIG`、`themeConsoleStyle`(`@/lib/themeConsoleStyle`)。
- Produces: `CONFIG.NEXT_STYLE_EDITORIAL`(boolean,默认 `true`);`style.js` 中常量 `EDITORIAL_CSS`(字符串,后续任务向其追加 CSS);`Style` 组件在配置开启时额外渲染 `<style>{EDITORIAL_CSS}</style>`。

- [ ] **Step 1: 写失败测试**

创建 `__tests__/themes/next/style.test.js`:

```js
import { renderToStaticMarkup } from 'react-dom/server.node'
import CONFIG from '@/themes/next/config'
import { Style } from '@/themes/next/style'

let editorialFlag = true

jest.mock('@/lib/config', () => ({
  siteConfig: jest.fn((key, defaultVal, extendConfig) => {
    if (key === 'NEXT_STYLE_EDITORIAL') return editorialFlag
    if (extendConfig && key in extendConfig) return extendConfig[key]
    return defaultVal ?? ''
  })
}))

jest.mock('@/lib/themeConsoleStyle', () => ({
  themeConsoleStyle: () => ''
}))

describe('next 主题书院风覆盖层', () => {
  it('CONFIG 默认开启 NEXT_STYLE_EDITORIAL', () => {
    expect(CONFIG.NEXT_STYLE_EDITORIAL).toBe(true)
  })

  it('开启时输出设计令牌与字体引入', () => {
    editorialFlag = true
    const html = renderToStaticMarkup(<Style />)
    expect(html).toContain('--bronze:#C08A3E')
    expect(html).toContain('Noto+Serif+SC')
    expect(html).toContain('--bg:#fbfaf8')
  })

  it('关闭时不输出书院风覆盖层', () => {
    editorialFlag = false
    const html = renderToStaticMarkup(<Style />)
    expect(html).not.toContain('--bronze')
    // 原有样式仍在
    expect(html).toContain('#theme-next .menu-link')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `yarn jest __tests__/themes/next/style.test.js`
Expected: FAIL(`CONFIG.NEXT_STYLE_EDITORIAL` 为 undefined;markup 不含 `--bronze`)

- [ ] **Step 3: 实现配置项**

`themes/next/config.js` 在 `NEXT_COLOR_BG` 一行之后新增:

```js
  NEXT_STYLE_EDITORIAL: true, // 经典书院风视觉覆盖层,false 回退原版样式
```

- [ ] **Step 4: 改造 style.js 加入覆盖层骨架**

> **修正案(执行中确认)**:styled-jsx 的 SWC 插件无法处理条件渲染中的 `<style jsx global>`(panic),且编译产物在 `renderToStaticMarkup` 中不输出内容;两处均改用原生 `<style>`(行为等价,样式本就全局)。

将 `themes/next/style.js` 全文改为:

```js
/* eslint-disable react/no-unknown-property */
import { siteConfig } from '@/lib/config'
import CONFIG from './config'
import { themeConsoleStyle } from '@/lib/themeConsoleStyle'

/**
 * 经典书院风覆盖层(方案 A)
 * 仅在 NEXT_STYLE_EDITORIAL 开启时输出;
 * 全部规则以 #theme-next 为作用域根,组件零改动。
 */
const EDITORIAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&display=swap');

  /* ===== 设计令牌 ===== */
  #theme-next {
    --ink:#1a202c;
    --blue:#2f6fde;
    --navy:#1E3A5F;
    --bronze:#C08A3E;
    --paper:#f7f1e6;
    --gray:#6b7280;
    --line:#e8e6e1;
    --bg:#fbfaf8;
    --serif:"Noto Serif SC","Songti SC","STSong",serif;
  }

  /* 页面底色 */
  body { background-color: #fbfaf8; }
`

/**
 * 此处样式只对当前主题生效
 * 此处不支持tailwindCSS的 @apply 语法
 * @returns
 */
const Style = () => {
  const flag = siteConfig('NEXT_STYLE_EDITORIAL', null, CONFIG)
  const editorial = flag === true || flag === 'true'
  return (
    <>
      <style>{`
      // 底色
      body {
        background-color: #eeedee;
      }
      .dark body {
        background-color: black;
      }

      // 菜单下划线动画
      #theme-next .menu-link {
        text-decoration: none;
        background-image: linear-gradient(#4e80ee, #4e80ee);
        background-repeat: no-repeat;
        background-position: bottom center;
        background-size: 0 2px;
        transition: background-size 100ms ease-in-out;
      }
      #theme-next .menu-link:hover {
        background-size: 100% 2px;
        color: #4e80ee;
      }

      ${themeConsoleStyle('next', CONFIG)}
  `}</style>
      {editorial && <style>{EDITORIAL_CSS}</style>}
    </>
  )
}

export { Style }
```

- [ ] **Step 5: 运行测试确认通过**

Run: `yarn jest __tests__/themes/next/style.test.js`
Expected: PASS(3 个用例)

- [ ] **Step 6: 提交**

```bash
git add themes/next/config.js themes/next/style.js __tests__/themes/next/style.test.js
git commit -m "feat(theme-next): 新增书院风开关与设计令牌覆盖层骨架"
```

---

### Task 2: 浅色覆盖 —— 全局、顶部装饰线、卡片、TopNav、Logo 块

**Files:**
- Modify: `themes/next/style.js`(向 `EDITORIAL_CSS` 追加)
- Test: `__tests__/themes/next/style.test.js`(追加断言)

**Interfaces:**
- Consumes: Task 1 的 `EDITORIAL_CSS` 常量与令牌变量。
- Produces: 无新接口,仅 CSS 规则。涉及的现有 DOM 锚点:`#theme-next > div.bg-gray-700`(顶部装饰线,`index.js` 第 151 行)、`#top-nav #sticky-nav > div.bg-black`(移动端顶栏,`TopNav.js` 第 139 行)、`#left .bg-black`(Logo 块,`Logo.js` 根 div)、`#theme-next section.bg-white`(Card 内层,`Card.js` 第 10 行)、`.menu-link`(下划线动画类)。

- [ ] **Step 1: 追加失败测试**

在 `__tests__/themes/next/style.test.js` 的「开启时」用例所在 describe 内新增:

```js
  it('开启时包含全局与顶栏覆盖规则', () => {
    editorialFlag = true
    const html = renderToStaticMarkup(<Style />)
    expect(html).toContain('#theme-next > div.bg-gray-700')
    expect(html).toContain('#top-nav #sticky-nav > div.bg-black')
    expect(html).toContain('linear-gradient(165deg')
    expect(html).toContain('.logo::after')
  })
```

- [ ] **Step 2: 运行测试确认失败**

Run: `yarn jest __tests__/themes/next/style.test.js`
Expected: 新用例 FAIL(markup 不含上述选择器)

- [ ] **Step 3: 向 EDITORIAL_CSS 追加 CSS**

在 `EDITORIAL_CSS` 模板字符串末尾(body 规则之后)追加:

```css
  /* ===== 全局强调色 ===== */
  #theme-next .menu-link {
    background-image: linear-gradient(var(--blue), var(--blue));
  }
  #theme-next .menu-link:hover { color: var(--blue); }
  #theme-next a.hover\\:text-blue-500:hover { color: var(--blue); }
  #theme-next .font-serif { font-family: var(--serif); }
  #theme-next .text-3xl { font-family: var(--serif); }

  /* ===== 顶部装饰线:灰黑 → 青铜 ===== */
  #theme-next > div.bg-gray-700 { background-color: var(--bronze); }

  /* ===== 卡片:边框 + 细阴影 ===== */
  #theme-next section.bg-white,
  #theme-next aside#left section.shadow {
    border: 1px solid var(--line);
    box-shadow: 0 1px 3px rgba(26,32,44,.06);
  }
  #theme-next .hover\\:shadow-xl:hover,
  #theme-next .md\\:hover\\:shadow-2xl:hover {
    box-shadow: 0 6px 18px rgba(26,32,44,.10);
  }

  /* ===== 移动端顶栏:黑底 → 宣纸米 + 青铜底线 ===== */
  #theme-next #top-nav #sticky-nav > div.bg-black {
    background-color: var(--paper);
    border-bottom: 2px solid var(--bronze);
  }
  #theme-next #top-nav .text-white { color: var(--navy); }
  #theme-next #top-nav .logo { letter-spacing: .12em; }

  /* ===== 左栏 Logo 块:黑底 → 宣纸渐变 + 青铜饰线 ===== */
  #theme-next #left .bg-black {
    background: linear-gradient(165deg,#fbf7ee 0%,var(--paper) 60%,#f1e8d6 100%);
    border-bottom: 3px solid var(--bronze);
  }
  #theme-next #left .logo {
    color: var(--navy);
    font-size: 21px;
    letter-spacing: .18em;
    text-indent: .18em;
  }
  #theme-next #left .logo::after {
    content: '';
    display: block;
    width: 44px;
    height: 2px;
    margin: 8px auto 0;
    background: var(--bronze);
  }
  #theme-next #left .text-gray-300 { color: var(--gray); }
```

- [ ] **Step 4: 运行测试确认通过**

Run: `yarn jest __tests__/themes/next/style.test.js`
Expected: PASS(4 个用例)

- [ ] **Step 5: 提交**

```bash
git add themes/next/style.js __tests__/themes/next/style.test.js
git commit -m "feat(theme-next): 书院风全局/顶栏/Logo块浅色覆盖"
```

---

### Task 3: 浅色覆盖 —— 左栏菜单/搜索/信息卡、文章卡、右栏

**Files:**
- Modify: `themes/next/style.js`(向 `EDITORIAL_CSS` 追加)
- Test: `__tests__/themes/next/style.test.js`(追加断言)

**Interfaces:**
- Consumes: Task 1 令牌。现有 DOM 锚点:`#posts-wrapper`(文章列表容器)、`#nav`(桌面菜单,`MenuList.js`)、`#left div.bg-gray-100`(搜索框,`SearchInput.js` 第 81 行)、`#right`(右侧栏)、`#tags-group`(标签云,`TagGroups.js`)、`.hover\:bg-gray-500`(最新文章/分类项 hover)、`aside .bg-gray-600`(选中态)、`#posts-wrapper a.bg-gray-800`(阅读全文按钮,`BlogPostCard.js` 第 108 行)、`#posts-wrapper a.text-3xl`(文章卡标题)。

- [ ] **Step 1: 追加失败测试**

describe 内新增:

```js
  it('开启时包含文章卡与侧栏覆盖规则', () => {
    editorialFlag = true
    const html = renderToStaticMarkup(<Style />)
    expect(html).toContain('#posts-wrapper a.text-3xl')
    expect(html).toContain('#posts-wrapper a.bg-gray-800')
    expect(html).toContain('#theme-next #nav li')
    expect(html).toContain('#tags-group a')
  })
```

- [ ] **Step 2: 运行测试确认失败**

Run: `yarn jest __tests__/themes/next/style.test.js`
Expected: 新用例 FAIL

- [ ] **Step 3: 向 EDITORIAL_CSS 追加 CSS**

```css
  /* ===== 左栏菜单:hover 蓝字 ===== */
  #theme-next #nav li.hover\\:bg-gray-700:hover {
    background-color: transparent;
    color: var(--blue);
    box-shadow: none;
  }

  /* ===== 左栏搜索框:灰底 → 白底细边 ===== */
  #theme-next #left div.bg-gray-100 {
    background-color: #fff;
    border: 1px solid var(--line);
    border-radius: 4px;
  }
  #theme-next #left input.bg-gray-100 {
    background-color: transparent;
    color: var(--ink);
  }

  /* ===== 文章卡 ===== */
  #theme-next #posts-wrapper a.text-3xl {
    font-size: 26px;
    line-height: 1.4;
  }
  #theme-next #posts-wrapper a.text-3xl .menu-link { color: #374151; }
  #theme-next #posts-wrapper a.text-3xl:hover .menu-link { color: var(--blue); }
  #theme-next #posts-wrapper p {
    color: #4b5563;
    line-height: 1.9;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  /* 阅读全文按钮:深墨 → hover 蓝 */
  #theme-next #posts-wrapper a.bg-gray-800 {
    background-color: var(--ink);
    font-size: 13px;
    padding: 10px 16px;
  }
  #theme-next #posts-wrapper a.bg-gray-800:hover {
    background-color: var(--blue);
    text-decoration: none;
  }

  /* ===== 右栏:latest/分类 hover 蓝底,选中态蓝 ===== */
  #theme-next #right .hover\\:bg-gray-500:hover,
  #theme-next #left .hover\\:bg-gray-500:hover {
    background-color: var(--blue);
    color: #fff;
  }
  #theme-next aside .bg-gray-600 { background-color: var(--blue); }

  /* ===== 右栏标签云:灰字 hover 蓝 ===== */
  #theme-next #right #tags-group a {
    background-color: transparent;
    box-shadow: none;
    color: #9ca3af;
  }
  #theme-next #right #tags-group a:hover {
    background-color: transparent;
    color: var(--blue);
  }
  #theme-next #right #tags-group a:hover div { color: var(--blue); }

  /* ===== InfoCard 作者名 ===== */
  #theme-next #left .text-2xl { font-family: var(--serif); }
```

- [ ] **Step 4: 运行测试确认通过**

Run: `yarn jest __tests__/themes/next/style.test.js`
Expected: PASS(5 个用例)

- [ ] **Step 5: 提交**

```bash
git add themes/next/style.js __tests__/themes/next/style.test.js
git commit -m "feat(theme-next): 书院风文章卡与左右侧栏浅色覆盖"
```

---

### Task 4: 浅色覆盖 —— 文章详情、归档/分类/标签/搜索页、Footer

**Files:**
- Modify: `themes/next/style.js`(向 `EDITORIAL_CSS` 追加)
- Test: `__tests__/themes/next/style.test.js`(追加断言)

**Interfaces:**
- Consumes: Task 1 令牌。现有 DOM 锚点:`#article-wrapper`(Notion 正文容器,**内部样式不动**)、`ul.bg-gray-100`(版权声明卡,`ArticleCopyright.js` 第 21 行)、`.my-4.border`(相关文章卡,`RecommendPosts.js` 第 16 行)、`li.hover\:border-gray-500`(归档条目,`BlogPostArchive.js` 第 26 行)、`.hover\:bg-gray-100`(分类索引项)、`#sticky-bar .bg-white`(标签/分类横向条,`StickyBar.js`)、`footer`(`Footer.js`)。

- [ ] **Step 1: 追加失败测试**

```js
  it('开启时包含详情页与页脚覆盖规则', () => {
    editorialFlag = true
    const html = renderToStaticMarkup(<Style />)
    expect(html).toContain('#theme-next ul.bg-gray-100')
    expect(html).toContain('#theme-next footer h1')
    expect(html).toContain('hover\\:border-gray-500')
  })
```

- [ ] **Step 2: 运行测试确认失败**

Run: `yarn jest __tests__/themes/next/style.test.js`
Expected: 新用例 FAIL

- [ ] **Step 3: 向 EDITORIAL_CSS 追加 CSS**

```css
  /* ===== 文章详情(NotionPage 正文不动) ===== */
  #theme-next #article-wrapper { background-color: transparent; }
  /* 版权声明卡:灰底蓝边 → 宣纸米青铜边 */
  #theme-next ul.bg-gray-100 {
    background-color: var(--paper);
    border-left-color: var(--bronze);
  }
  /* 相关文章卡 */
  #theme-next .my-4.border { border-color: var(--line); }

  /* ===== 归档 ===== */
  #theme-next li.hover\\:border-gray-500:hover { border-left-color: var(--bronze); }
  #theme-next a.hover\\:underline:hover:not(.bg-gray-800) { color: var(--blue); }

  /* ===== 分类/标签索引 hover ===== */
  #theme-next .hover\\:bg-gray-100:hover { background-color: var(--paper); }

  /* ===== 标签/分类横向 StickyBar ===== */
  #theme-next #sticky-bar .bg-white {
    border: 1px solid var(--line);
    box-shadow: 0 1px 3px rgba(26,32,44,.06);
  }

  /* ===== Footer ===== */
  #theme-next footer {
    border-top: 1px solid var(--line);
    color: #9ca3af;
  }
  #theme-next footer h1 {
    font-family: var(--serif);
    font-weight: 700;
    color: var(--ink);
    font-size: 14px;
  }
```

- [ ] **Step 4: 运行测试确认通过**

Run: `yarn jest __tests__/themes/next/style.test.js`
Expected: PASS(6 个用例)

- [ ] **Step 5: 提交**

```bash
git add themes/next/style.js __tests__/themes/next/style.test.js
git commit -m "feat(theme-next): 书院风详情页/归档/页脚浅色覆盖"
```

---

### Task 5: 暗色令牌映射与暗色覆盖

**Files:**
- Modify: `themes/next/style.js`(向 `EDITORIAL_CSS` 追加)
- Test: `__tests__/themes/next/style.test.js`(追加断言)

**Interfaces:**
- Consumes: Task 1-4 的令牌与规则;`.dark` 类挂在 `<html>`(`lib/global.js` 第 79-80 行)。
- Produces: `.dark #theme-next` 令牌映射;暗色下的卡片面(`dark:bg-hexo-black-gray`、`dark:bg-gray-800`)、文字色、Logo 块、body 底色覆盖。

- [ ] **Step 1: 追加失败测试**

```js
  it('开启时包含暗色令牌与暗色覆盖', () => {
    editorialFlag = true
    const html = renderToStaticMarkup(<Style />)
    expect(html).toContain('.dark #theme-next')
    expect(html).toContain('--bg:#141210')
    expect(html).toContain('.dark body')
    expect(html).toContain('.dark\\:bg-hexo-black-gray')
  })
```

- [ ] **Step 2: 运行测试确认失败**

Run: `yarn jest __tests__/themes/next/style.test.js`
Expected: 新用例 FAIL

- [ ] **Step 3: 向 EDITORIAL_CSS 追加 CSS**

```css
  /* ===== 暗色令牌映射 ===== */
  .dark #theme-next {
    --ink:#e8e2d6;
    --blue:#7aa2f0;
    --navy:#c9b98f;
    --paper:#1d1a16;
    --gray:#9a917f;
    --line:#332e26;
    --bg:#141210;
  }
  .dark body { background-color: #141210; }

  /* ===== 暗色卡片面 ===== */
  .dark #theme-next .dark\\:bg-hexo-black-gray {
    background-color: #1d1a16;
    border-color: var(--line);
  }
  .dark #theme-next .dark\\:bg-gray-800 { background-color: #26211b; }
  .dark #theme-next .dark\\:bg-gray-700 { background-color: #26211b; }
  .dark #theme-next #left div.bg-gray-100 {
    background-color: #26211b;
    border-color: var(--line);
  }
  .dark #theme-next #left input.bg-gray-100 { color: var(--ink); }

  /* ===== 暗色 Logo 块与顶栏 ===== */
  .dark #theme-next #left .bg-black {
    background: linear-gradient(165deg,#26211b 0%,#1d1a16 60%,#191512 100%);
    border-bottom-color: var(--bronze);
  }
  .dark #theme-next #left .logo { color: var(--navy); }
  .dark #theme-next #top-nav #sticky-nav > div.bg-black {
    background-color: #1d1a16;
    border-bottom-color: var(--bronze);
  }
  .dark #theme-next #top-nav .text-white { color: var(--navy); }

  /* ===== 暗色文字与文章卡 ===== */
  .dark #theme-next .text-gray-700,
  .dark #theme-next .text-gray-600 { color: #cfc7b8; }
  .dark #theme-next .text-gray-500 { color: var(--gray); }
  .dark #theme-next #posts-wrapper a.text-3xl .menu-link { color: var(--ink); }
  .dark #theme-next #posts-wrapper p { color: #b8b0a0; }
  .dark #theme-next #posts-wrapper a.bg-gray-800 { background-color: #e8e2d6; color: #1a202c; }
  .dark #theme-next #posts-wrapper a.bg-gray-800:hover { background-color: var(--blue); color: #141210; }
  .dark #theme-next ul.bg-gray-100 { background-color: #26211b; }
  .dark #theme-next #right #tags-group a { color: var(--gray); }
  .dark #theme-next footer { background-color: #1d1a16; color: var(--gray); }
  .dark #theme-next footer h1 { color: var(--ink); }
```

- [ ] **Step 4: 运行测试确认通过**

Run: `yarn jest __tests__/themes/next/style.test.js`
Expected: PASS(7 个用例)

- [ ] **Step 5: 提交**

```bash
git add themes/next/style.js __tests__/themes/next/style.test.js
git commit -m "feat(theme-next): 书院风暗色令牌与暗色覆盖"
```

---

### Task 6: 文档更新与全量验证

**Files:**
- Modify: `docs/user-guide/themes/next.md`(配置表新增一行,在第 61 行 `NEXT_RIGHT_BAR` 附近)

**Interfaces:**
- Consumes: Task 1-5 全部产出。
- Produces: 文档配置项说明;质量门禁结果。

- [ ] **Step 1: 更新主题文档**

`docs/user-guide/themes/next.md` 配置表追加一行(保持表格格式与既有行一致):

```markdown
| `NEXT_STYLE_EDITORIAL` | 经典书院风视觉覆盖层,默认 true,false 回退原版样式 |
```

- [ ] **Step 2: 运行 lint 与类型检查**

Run: `yarn lint && yarn type-check`
Expected: 通过,无新增 error

- [ ] **Step 3: 运行全量测试**

Run: `yarn test --passWithNoTests`
Expected: 全绿,`__tests__/themes/next/style.test.js` 7 个用例通过

- [ ] **Step 4: 视觉冒烟(需本地 Notion 数据)**

Run: `yarn dev`,浏览器核对:桌面三栏 / 移动端 TopNav / 暗色切换三态,页面覆盖首页、文章详情、归档、分类、标签、搜索;同时用 `NEXT_PUBLIC_NEXT_STYLE_EDITORIAL=false yarn dev` 验证回退原版。
若本机无 `NOTION_PAGE_ID` 无法起站,记录该限制并跳过,不视为失败。

- [ ] **Step 5: 性能准入(主题大改规范)**

Run: `yarn build && yarn start`,另开终端 `yarn perf:audit:themes`
Expected: next 主题 Performance ≥ 60、SEO ≥ 90、LCP ≤ 4000ms、CLS ≤ 0.1;提交 `docs/performance/theme-audit-latest.{md,json}`。若因缺少 Notion 数据无法构建,记录原因跳过。

- [ ] **Step 6: 提交**

```bash
git add docs/user-guide/themes/next.md docs/performance/theme-audit-latest.md docs/performance/theme-audit-latest.json
git commit -m "docs(theme-next): 书院风配置项文档与性能审计结果"
```

(若性能审计跳过,仅提交文档。)

---

## Self-Review 记录

- 规格覆盖:配置项(T1)、令牌/字体(T1)、全局/顶栏/卡片/Logo(T2)、侧栏/文章卡/右栏(T3)、详情/归档/页脚(T4)、暗色(T5)、文档与性能准入(T6)—— 规格第 3-8 节均有对应任务。
- 选择器均来自实际组件源码(行号已在各任务 Interfaces 标注),`hover\:x` 转义类名与 Tailwind 生成类一致。
- 无占位符;各任务 CSS 完整可复制。
