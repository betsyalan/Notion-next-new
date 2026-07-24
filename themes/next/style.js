import { siteConfig } from '@/lib/config'
import CONFIG from './config'
import { themeConsoleStyle } from '@/lib/themeConsoleStyle'

/**
 * 经典书院风覆盖层(方案 A)
 * 仅在 NEXT_STYLE_EDITORIAL 开启时输出;
 * 覆盖规则以 #theme-next 为作用域根(body 底色等少数全局规则除外),组件零改动。
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
      {editorial && <style dangerouslySetInnerHTML={{ __html: EDITORIAL_CSS }} />}
    </>
  )
}

export { Style }
