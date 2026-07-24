# next 主题「经典书院风」视觉改造设计

- 日期:2026-07-24
- 状态:已获用户确认
- 风格基准:`public/design-preview/style-next-editorial.html`(方案 A「经典书院风」)

## 1. 目标与约束

将 `themes/next` 主题的视觉样式改造为预览稿定义的「经典书院风」(宣纸米底、藏青标题、青铜点缀、衬线标题),同时严格遵守:

- **不修改原主题的框架与接口**:`themes/next/index.js` 的所有 `Layout*` 导出、组件 props、目录结构保持不变。
- **不改变内容获取方式**:文章、分类、标签、菜单、站点信息等绝大多数内容仍从 Notion 获取,数据流(`lib/db/` → `useGlobal` → 主题组件)不动。
- **Notion 正文渲染不动**:文章详情页的 `NotionPage`(react-notion-x)正文样式不做改造。

## 2. 关键决策(已与用户确认)

| 决策点 | 结论 |
| --- | --- |
| 落地方式 | 可配置开关 `NEXT_STYLE_EDITORIAL`,**默认 `true`**(开箱即书院风;关闭通道:Notion 配置表同名键置 false,或改 themes/next/config.js 默认值。注:主题级 NEXT_* 键在本仓库 siteConfig 机制下无环境变量管道,与全仓库惯例一致) |
| 实现机制 | 方案一:纯 CSS 覆盖层,组件 JS 零改动 |
| 暗色模式 | 为书院风配套设计暗色令牌(预览稿仅有浅色) |
| 标题字体 | 加载 Google Fonts `Noto Serif SC`(衬线标题),正文维持无衬线 |
| 覆盖范围 | 全站所有页面统一(首页/列表/详情/归档/分类/标签/搜索/404) |

## 3. 架构与配置

- `themes/next/config.js` 新增 `NEXT_STYLE_EDITORIAL: true`,走现有 `siteConfig()` 三级读取(Notion 配置表 > 环境变量 > 主题默认值)。
- `themes/next/style.js` 读取该配置:为 true 时在现有 `<style jsx global>` 内追加「书院风覆盖层」CSS;为 false 时零输出,主题保持原样。
- 所有覆盖规则以 `#theme-next` 为作用域根;暗色规则以 `.dark #theme-next` 为作用域根。
- 组件 JS、布局结构、数据流完全不改动;字体通过覆盖层 CSS `@import` 引入,不引入 next/font 等组件级机制。

## 4. 设计令牌

浅色(迁移自预览稿 `:root`,作用域改为 `#theme-next`):

| 变量 | 值 | 用途 |
| --- | --- | --- |
| `--ink` | `#1a202c` | 主文字色 |
| `--blue` | `#2f6fde` | 交互强调色(替代 `#4e80ee`) |
| `--navy` | `#1E3A5F` | 学术藏青(标题/点缀) |
| `--bronze` | `#C08A3E` | 青铜点缀(装饰线/分隔符) |
| `--paper` | `#f7f1e6` | 宣纸米(Logo 块/顶栏底色) |
| `--gray` | `#6b7280` | 次要文字 |
| `--line` | `#e8e6e1` | 分隔线(暖灰) |
| `--bg` | `#fbfaf8` | 页面底色(替代 `#eeedee`) |
| `--serif` | `"Noto Serif SC","Songti SC","STSong",serif` | 衬线字体栈 |

暗色(新设计,`.dark #theme-next` 下同名变量映射):

| 变量 | 暗色值 | 说明 |
| --- | --- | --- |
| `--bg` | `#141210` | 深墨纸底 |
| `--ink` | `#e8e2d6` | 主文字 |
| `--gray` | `#9a917f` | 次要文字 |
| `--line` | `#332e26` | 分隔线 |
| `--blue` | `#7aa2f0` | 强调蓝(暗底提亮) |
| `--navy` | `#c9b98f` | 藏青转青铜浅色,保证暗底可读 |
| `--bronze` | `#C08A3E` | 不变 |
| `--paper` | `#1d1a16` | 卡片/Logo 块面 |

暗色下卡片背景、hover 阴影、覆盖层透明度同步调暗。

## 5. 覆盖清单(全部经作用域 CSS,不改组件)

- **全局**:body 底色、`#4e80ee` → `var(--blue)`(含 `.menu-link` 下划线动画)、顶部 `bg-gray-700` 黑线 → 青铜细线、`Card` 卡片改为预览的边框 + 阴影风格(白底/1px `--line`/hover 阴影加深)。
- **TopNav(移动端)**:黑底 → `var(--paper)` + 2px 青铜底线,站名衬线。
- **左栏(SideAreaLeft)**:Logo 块黑底 → 宣纸渐变(`#fbf7ee → --paper → #f1e8d6`)+ 3px 青铜底线 + 衬线站名 + 青铜饰线;菜单项、搜索框、InfoCard 作者名衬线化。
- **文章卡(BlogPostCard)**:标题 26px 衬线居中 + hover 蓝色下划线动画,meta 居中轻字重,摘要 3 行截断 `line-height:1.9`,"阅读全文"深墨按钮 hover 变 `var(--blue)`。
- **右栏(SideAreaRight)**:最新文章/分类项 hover 蓝底白字,标签云灰色 hover 变蓝,卡片头样式。
- **文章详情(ArticleDetail)**:标题区衬线居中、元信息、版权声明/相关文章卡配色;`NotionPage` 正文不动。
- **归档/分类/标签/搜索/404**:白底容器 → 卡片变量底色,区块标题衬线化。
- **Footer**:按预览稿(白底/暖灰分隔线/衬线署名)。

### CSS 优先级策略

- 覆盖选择器形式:`#theme-next <现有类名/结构选择器>`,利用 ID 特异性(1-x-x)压制元素上的 Tailwind 工具类。
- `!important` 仅限颜色/字体属性,禁止用于布局类(width/margin/padding/flex 等)。
- body 背景等 `#theme-next` 之外的规则,沿用 style.js 现有 body 规则写法,改为引用变量。

## 6. 字体加载

覆盖层顶部 `@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&display=swap');`(仅 700 字重,`display=swap` 避免阻塞渲染)。标题、Logo 站名、InfoCard 作者名、页脚署名使用 `var(--serif)`;正文与 UI 维持无衬线栈。

## 7. 错误处理与边界

- 字体加载失败:字体栈回退到 `Songti SC/STSong/serif` 系统衬线,布局不破坏。
- 配置关闭(`NEXT_STYLE_EDITORIAL=false`):覆盖层不输出,主题渲染与现状完全一致。
- 暗色切换:`.dark` 类由全站现有机制控制,覆盖层仅追加 `.dark #theme-next` 变量映射与配色规则。

## 8. 测试与验证

1. `yarn lint`、`yarn type-check`、`yarn test` 全绿;`themes/next` 相关既有测试不回归。
2. `yarn dev` 下与预览稿比对:桌面三栏 / 移动端 TopNav / 暗色三态,覆盖首页、文章详情、归档、分类、标签、搜索页。
3. 配置开关两态验证:true(书院风)/ false(原版)渲染符合预期。
4. 性能准入(主题大改按项目规范执行):`yarn build && yarn start` 后跑 `yarn perf:audit:themes`,门槛 Performance ≥ 60、SEO ≥ 90、LCP ≤ 4000ms、CLS ≤ 0.1,提交 `docs/performance/theme-audit-latest.{md,json}`。

## 9. 影响面

- 修改文件:`themes/next/config.js`(新增 1 个配置项)、`themes/next/style.js`(追加覆盖层 CSS)。
- 可能新增:`__tests__/themes/next/` 下针对配置默认值与 style.js 开关输出的测试。
- 不改:组件 JS、布局、数据获取、`lib/`、`pages/`、其他主题。
