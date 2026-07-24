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
 * 注:刻意使用原生 <style> 而非 styled-jsx 的 <style jsx global>,
 * 因为 styled-jsx 的 SWC 插件无法处理条件渲染中的 style 标签(会 panic),
 * 且编译后的 JSXStyle 在 renderToStaticMarkup 中不输出内容,无法测试。
 * 原生 <style> 同为全局生效,行为等价。
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
