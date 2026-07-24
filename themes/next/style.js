import { siteConfig } from '@/lib/config'
import CONFIG from './config'
import { themeConsoleStyle } from '@/lib/themeConsoleStyle'

/**
 * 经典书院风覆盖层(方案 A)
 * 仅在 NEXT_STYLE_EDITORIAL 开启时输出;
 * 覆盖规则以 #theme-next 为作用域根(body 底色等少数全局规则除外),组件零改动。
 */
const EDITORIAL_CSS = `
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
  /* Logo 块透明化:复用 Logo 组件的硬编码 bg-black 黑块改为透出顶栏宣纸米,
     文字色改灰;特异性(2 ID)低于上方顶栏条规则(3 ID),不影响顶栏条本身 */
  #theme-next #top-nav .bg-black { background-color: transparent; }
  #theme-next #top-nav .text-gray-300 { color: var(--gray); }

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
  .dark #theme-next #posts-wrapper a.text-3xl:hover .menu-link { color: var(--blue); }
  .dark #theme-next #posts-wrapper p { color: #b8b0a0; }
  .dark #theme-next #posts-wrapper a.bg-gray-800 { background-color: #e8e2d6; color: #1a202c; }
  .dark #theme-next #posts-wrapper a.bg-gray-800:hover { background-color: var(--blue); color: #141210; }
  .dark #theme-next ul.bg-gray-100 { background-color: #26211b; }
  .dark #theme-next #right #tags-group a { color: var(--gray); }
  .dark #theme-next footer { background-color: #1d1a16; color: var(--gray); }
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
 * 书院风字体经并列 <link rel='stylesheet'> 异步加载,而非 CSS 内 @import:
 * @import 会阻塞整个覆盖层样式表的渲染,字体加载失败时仍回退系统衬线。
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
      {editorial && (
        <>
          <link
            rel='stylesheet'
            href='https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&display=swap'
          />
          <style dangerouslySetInnerHTML={{ __html: EDITORIAL_CSS }} />
        </>
      )}
    </>
  )
}

export { Style }
