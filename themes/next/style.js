import { siteConfig } from '@/lib/config'
import CONFIG from './config'
import { themeConsoleStyle } from '@/lib/themeConsoleStyle'

/**
 * 现代简约覆盖层(浅色 · 藏蓝)
 * 仅在 NEXT_STYLE_EDITORIAL 开启时输出;
 * 覆盖规则以 #theme-next 为作用域根(body 底色等少数全局规则除外),组件零改动。
 */
const EDITORIAL_CSS = `
  /* ===== 设计令牌 ===== */
  #theme-next {
    --ink:#0f172a;
    --blue:#2563eb;
    --navy:#1e3a5f;
    --paper:#f1f5f9;
    --gray:#64748b;
    --line:#e2e8f0;
    --bg:#f8fafc;
    --sans:"PingFang SC",-apple-system,BlinkMacSystemFont,"Hiragino Sans GB","Microsoft YaHei","Segoe UI","Noto Sans SC",sans-serif;
  }

  /* 页面底色 */
  body { background-color: #f8fafc; }

  /* ===== 全局强调色 ===== */
  #theme-next .menu-link {
    background-image: linear-gradient(var(--blue), var(--blue));
  }
  #theme-next .menu-link:hover { color: var(--blue); }
  #theme-next a.hover\\:text-blue-500:hover { color: var(--blue); }
  #theme-next .font-serif { font-family: var(--sans); }
  #theme-next .text-3xl { font-family: var(--sans); }

  /* ===== 顶部装饰线:藏蓝 → 蓝渐变(呼应品牌) ===== */
  #theme-next > div.bg-gray-700 {
    background: linear-gradient(90deg, var(--navy), var(--blue));
  }

  /* ===== 卡片:圆角 + 细边 + 轻阴影 ===== */
  #theme-next section.bg-white,
  #theme-next aside#left section.shadow {
    border: 1px solid var(--line);
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(15,23,42,.04);
  }
  #theme-next .hover\\:shadow-xl:hover,
  #theme-next .md\\:hover\\:shadow-2xl:hover {
    box-shadow: 0 8px 24px rgba(15,23,42,.08);
  }

  /* ===== 移动端顶栏:黑底 → 与主页一致的底色(--bg) + 蓝色底线 ===== */
  #theme-next #top-nav #sticky-nav > div.bg-black {
    background-color: var(--bg);
    border-bottom: 2px solid var(--blue);
  }
  #theme-next #top-nav .text-white { color: var(--navy); }
  #theme-next #top-nav .logo { letter-spacing: .12em; }
  /* Logo 块透明化:复用 Logo 组件的硬编码 bg-black 黑块改为透出顶栏底色,
     文字色改灰;特异性(2 ID)低于上方顶栏条规则(3 ID),不影响顶栏条本身 */
  #theme-next #top-nav .bg-black { background-color: transparent; }
  #theme-next #top-nav .text-gray-300 { color: var(--gray); }

  /* ===== 左栏 Logo 块:黑底 → 与主页一致的底色(--bg) + 蓝色饰线 ===== */
  #theme-next #left .bg-black {
    background: var(--bg);
    border-bottom: 3px solid var(--blue);
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
    background: var(--blue);
  }
  #theme-next #left .text-gray-300 { color: var(--gray); }

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
    border-radius: 8px;
  }
  #theme-next #left input.bg-gray-100 {
    background-color: transparent;
    color: var(--ink);
  }

  /* ===== 文章卡 ===== */
  /* 文章卡标题:显式 700,避免继承根节点字重(font-light 或 400)导致标题偏细 */
  #theme-next #posts-wrapper a.text-3xl {
    font-size: 26px;
    line-height: 1.4;
    font-weight: 700;
  }
  #theme-next #posts-wrapper a.text-3xl .menu-link { color: #1e293b; }
  #theme-next #posts-wrapper a.text-3xl:hover .menu-link { color: var(--blue); }
  #theme-next #posts-wrapper p {
    color: #475569;
    line-height: 1.8;
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
    border-radius: 8px;
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

  /* ===== 右栏标签云:Notion 选项色徽章 =====
     底色(notion-*_background)与文字色(notion-*)由组件按 Notion 选项色输出,
     此处仅去掉默认阴影;hover 蓝底白字由通用 hover 规则与组件 group-hover 处理 */
  #theme-next #right #tags-group a {
    box-shadow: none;
  }

  /* ===== InfoCard 作者名 ===== */
  #theme-next #left .text-2xl { font-family: var(--sans); }

  /* ===== 文章详情(NotionPage 正文不动) ===== */
  #theme-next #article-wrapper { background-color: transparent; }
  /* 版权声明卡:灰底蓝边 → 冷灰底蓝边 */
  #theme-next ul.bg-gray-100 {
    background-color: var(--paper);
    border-left-color: var(--blue);
  }
  /* 相关文章卡 */
  #theme-next .my-4.border { border-color: var(--line); }

  /* ===== 归档 ===== */
  #theme-next li.hover\\:border-gray-500:hover { border-left-color: var(--blue); }
  #theme-next a.hover\\:underline:hover:not(.bg-gray-800) { color: var(--blue); }

  /* ===== 分类/标签索引 hover ===== */
  #theme-next .hover\\:bg-gray-100:hover { background-color: var(--paper); }

  /* ===== 标签/分类横向 StickyBar ===== */
  #theme-next #sticky-bar .bg-white {
    border: 1px solid var(--line);
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(15,23,42,.04);
  }

  /* ===== Footer ===== */
  #theme-next footer {
    border-top: 1px solid var(--line);
    color: #94a3b8;
  }
  #theme-next footer h1 {
    font-family: var(--sans);
    font-weight: 700;
    color: var(--ink);
    font-size: 14px;
  }

  /* ===== 暗色令牌映射(冷调 slate) ===== */
  .dark #theme-next {
    --ink:#e2e8f0;
    --blue:#60a5fa;
    --navy:#93c5fd;
    --paper:#1e293b;
    --gray:#94a3b8;
    --line:#334155;
    --bg:#0f172a;
  }
  .dark body { background-color: #0f172a; }

  /* ===== 暗色 Notion 选项色调色板(取自 react-notion-x 暗色主题) =====
     标签/分类徽章的底色与文字色在暗色下仍按选项色呈现;
     同时改善文章正文中彩色文字/背景的暗色对比度 */
  .dark #theme-next {
    --notion-red: rgb(255,115,105);
    --notion-pink: rgb(226,85,161);
    --notion-blue: rgb(82,156,202);
    --notion-purple: rgb(154,109,215);
    --notion-teal: rgb(77,171,154);
    --notion-yellow: rgb(255,220,73);
    --notion-orange: rgb(255,163,68);
    --notion-brown: rgb(147,114,100);
    --notion-gray: rgba(151,154,155,.95);
    --notion-red_background: rgb(89,65,65);
    --notion-pink_background: rgb(83,59,76);
    --notion-blue_background: rgb(54,73,84);
    --notion-purple_background: rgb(68,63,87);
    --notion-teal_background: rgb(53,76,75);
    --notion-yellow_background: rgb(89,86,59);
    --notion-orange_background: rgb(89,74,58);
    --notion-brown_background: rgb(67,64,64);
    --notion-gray_background: rgb(69,75,78);
    --notion-green_background: rgb(53,76,75);
    --notion-default_background: rgb(64,68,70);
  }

  /* ===== 暗色卡片面 ===== */
  .dark #theme-next .dark\\:bg-hexo-black-gray {
    background-color: #1e293b;
    border-color: var(--line);
  }
  .dark #theme-next .dark\\:bg-gray-800 { background-color: #1e293b; }
  .dark #theme-next .dark\\:bg-gray-700 { background-color: #1e293b; }
  .dark #theme-next #left div.bg-gray-100 {
    background-color: #1e293b;
    border-color: var(--line);
  }
  .dark #theme-next #left input.bg-gray-100 { color: var(--ink); }

  /* ===== 暗色 Logo 块与顶栏:与暗色页面底色(--bg)一致 ===== */
  .dark #theme-next #left .bg-black {
    background: var(--bg);
    border-bottom-color: var(--blue);
  }
  .dark #theme-next #left .logo { color: var(--navy); }
  .dark #theme-next #top-nav #sticky-nav > div.bg-black {
    background-color: var(--bg);
    border-bottom-color: var(--blue);
  }
  .dark #theme-next #top-nav .text-white { color: var(--navy); }

  /* ===== 暗色文字与文章卡 ===== */
  .dark #theme-next .text-gray-700,
  .dark #theme-next .text-gray-600 { color: #cbd5e1; }
  .dark #theme-next .text-gray-500 { color: var(--gray); }
  .dark #theme-next #posts-wrapper a.text-3xl .menu-link { color: var(--ink); }
  .dark #theme-next #posts-wrapper a.text-3xl:hover .menu-link { color: var(--blue); }
  .dark #theme-next #posts-wrapper p { color: #94a3b8; }
  .dark #theme-next #posts-wrapper a.bg-gray-800 { background-color: #e2e8f0; color: #0f172a; }
  .dark #theme-next #posts-wrapper a.bg-gray-800:hover { background-color: var(--blue); color: #0f172a; }
  .dark #theme-next ul.bg-gray-100 { background-color: #1e293b; }
  .dark #theme-next footer { background-color: #1e293b; color: var(--gray); }
  .dark #theme-next footer h1 { color: var(--ink); }
`

/**
 * 此处样式只对当前主题生效
 * 此处不支持tailwindCSS的 @apply 语法
 * 注:刻意使用原生 <style> 而非 styled-jsx 的 <style jsx global>,
 * 因为 styled-jsx 的 SWC 插件无法处理条件渲染中的 style 标签(会 panic),
 * 且编译后的 JSXStyle 在 renderToStaticMarkup 中不输出内容,无法测试。
 * 原生 <style> 同为全局生效,行为等价。
 * 覆盖层用 dangerouslySetInnerHTML 输出:React 会把 <style> 文本子节点的 >
 * 转义为 &gt;,且 style 是 raw-text 元素不会反转义;EDITORIAL_CSS 为仓库内
 * 静态常量,无注入面。
 * 现代简约标题使用系统无衬线栈(--sans: PingFang SC/系统黑体),
 * 与正文同族、靠字重分层(标题 700 / 正文 400);
 * 刻意不加载任何网络字体:中文 webfont 切片多、单字重全量可达 14MB+,
 * 且 Google Fonts 在国内不稳定会阻塞首屏渲染。
 * @returns
 */
const Style = () => {
  const flag = siteConfig('NEXT_STYLE_EDITORIAL', null, CONFIG)
  const editorial = flag === true || flag === 'true'
  return (
    <>
      <style>{`
      /* 底色 */
      body {
        background-color: #eeedee;
      }
      .dark body {
        background-color: black;
      }

      /* 菜单下划线动画 */
      #theme-next .menu-link {
        text-decoration: none;
        background-image: linear-gradient(#4e80ee, #4e80ee);
        background-repeat: no-repeat;
        background-position: bottom center;
        background-size: 0 2px;
        transition: background-size 200ms ease-in-out;
      }
      #theme-next .menu-link:hover {
        background-size: 100% 2px;
        color: #4e80ee;
      }

      ${themeConsoleStyle('next', CONFIG)}
  `}</style>
      {editorial && <style dangerouslySetInnerHTML={{ __html: EDITORIAL_CSS }} />}
    </>
  )
}

export { Style }
