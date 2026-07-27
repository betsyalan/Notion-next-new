# next 主题左侧文章树（NavPostTree）设计

- 日期：2026-07-27
- 范围：仅 `themes/next` 主题，不影响其他主题
- 状态：已与用户确认

## 背景与目标

next 主题左侧栏（`SideAreaLeft`）目前只有菜单卡 + 「目录/关于」Tabs，非文章页只剩「关于」页签，空间闲置。用户希望参考文章页目录（TOC）的样式与交互，在左侧栏增加一个**文章树形列表**（分类→文章两层），桌面端常驻、移动端在汉堡菜单中可用。

## 需求要点（已澄清）

- 层级组织：**分类→文章两层**（Notion category 为单层下拉值，不做多级拆分）
- 展示位置：**独立卡片常驻**（非 Tabs 新页签）
- 交互：**分类可折叠 + 当前文章高亮**，当前文章所在分组自动展开，其余默认折叠
- 移动端：**需要**，放入 `TopNav` 汉堡菜单的 `Collapse` 内
- 实现路线：在 `themes/next/components/` 新建组件，不抽取共享组件

## 数据流

无需改数据层。所有 Layout 已通过 `lib/db/SiteDataApi.js` 拿到 `allNavPages`（已过滤 `type==='Post' && status==='Published'` 且有 slug，字段含 `id/title/slug/href/category/pageIcon/publishDate`）。

组件内按 `post.category` 分组成"分类→文章"两层树：

- 无 `category` 的文章归入「未分类」组
- 文章在组内按 `publishDate` 倒序
- 零新增数据请求

## 组件设计：`themes/next/components/NavPostTree.js`

参照 gitbook 主题的 `NavPostList`/`NavPostItem` 移植（`themes/gitbook/components/NavPostList.js:116-143` 的分组逻辑），样式贴合 next 主题：

- `groupArticles(allNavPages)`：按 `category` 分组
- `expandedGroups` 状态：手风琴式排他折叠；chevron 图标旋转 + `@/components/Collapse` 展开动画；分组左侧 `border-l` 树线
- 根据 `router.asPath` 匹配 `post.href`：自动展开当前文章所在分组并高亮当前文章（`font-bold` + 主题色，参照 `themes/next/components/Toc.js:94`）
- 外层 `overflow-y-auto max-h-96` 滚动容器（与 Toc 一致）
- 兼容 dark 模式与书院风覆盖层（`themes/next/style.js` 的 `--ink/--blue/--bronze` 设计令牌）
- 空数据（无文章）时不渲染卡片

## 接入点

1. **桌面端**：`themes/next/components/SideAreaLeft.js` sticky 区，在 Tabs 卡片下方加独立卡片 `<NavPostTree allNavPages={...}>`，所有页面常驻。
2. **移动端**：`themes/next/components/TopNav.js`（159-161 行）汉堡 `Collapse` 菜单内、`MenuList` 下方插入同一组件。
3. 若 `allNavPages` 未透传到这两个组件，在 `themes/next/index.js` 的 `LayoutBase` 补透传（实现时先确认现有 props 链路，`SideAreaLeft`/`TopNav` 已接收展开 props，大概率无需改动）。

## 配置开关

`themes/next/config.js` 新增：

```js
NEXT_LEFT_POST_TREE: true
```

两处接入点统一用 `siteConfig('NEXT_LEFT_POST_TREE', true, CONFIG)` 读取，默认开启。

## 测试

新增 `__tests__/themes/next/NavPostTree.test.js`：

- 按分类分组渲染
- 折叠/展开切换
- 当前文章高亮与所在分组自动展开
- 空数据兜底（不渲染）

验证命令：`yarn lint`、`yarn type-check`、`yarn test`。

## 改动文件清单

- 新增：`themes/next/components/NavPostTree.js`
- 新增：`__tests__/themes/next/NavPostTree.test.js`
- 修改：`themes/next/components/SideAreaLeft.js`
- 修改：`themes/next/components/TopNav.js`
- 修改：`themes/next/config.js`
- 视情况：`themes/next/index.js`（补 props 透传）
- 文档：若 `docs/user-guide/themes/` 下存在 next 主题文档，补充 `NEXT_LEFT_POST_TREE` 配置说明

## 明确不做（YAGNI）

- 不做多级分类拆分（category 单层）
- 不抽取为全站共享组件
- 不改其他 24 个主题
- 不做移动端独立抽屉（复用现有汉堡菜单）
