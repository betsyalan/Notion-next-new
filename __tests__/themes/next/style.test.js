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

  it('开启时包含全局与顶栏覆盖规则', () => {
    editorialFlag = true
    const html = renderToStaticMarkup(<Style />)
    expect(html).toContain('#theme-next > div.bg-gray-700')
    expect(html).toContain('#top-nav #sticky-nav > div.bg-black')
    expect(html).toContain('linear-gradient(165deg')
    expect(html).toContain('.logo::after')
    // 防回归:模板字符串中的 \: 需写成 \\: 才能保留反斜杠
    expect(html).toContain('hover\\:shadow-xl')
  })

  it('开启时包含文章卡与侧栏覆盖规则', () => {
    editorialFlag = true
    const html = renderToStaticMarkup(<Style />)
    expect(html).toContain('#posts-wrapper a.text-3xl')
    expect(html).toContain('#posts-wrapper a.bg-gray-800')
    expect(html).toContain('#theme-next #nav li')
    expect(html).toContain('#tags-group a')
  })

  it('开启时包含详情页与页脚覆盖规则', () => {
    editorialFlag = true
    const html = renderToStaticMarkup(<Style />)
    expect(html).toContain('#theme-next ul.bg-gray-100')
    expect(html).toContain('#theme-next footer h1')
    expect(html).toContain('hover\\:border-gray-500')
  })

  it('开启时包含暗色令牌与暗色覆盖', () => {
    editorialFlag = true
    const html = renderToStaticMarkup(<Style />)
    expect(html).toContain('.dark #theme-next')
    expect(html).toContain('--bg:#141210')
    expect(html).toContain('.dark body')
    expect(html).toContain('.dark\\:bg-hexo-black-gray')
    // 暗色下文章列表标题 hover 变蓝
    expect(html).toContain(
      'a.text-3xl:hover .menu-link { color: var(--blue); }'
    )
  })

  it('覆盖层 style 输出在原样式块之后', () => {
    editorialFlag = true
    const html = renderToStaticMarkup(<Style />)
    expect(html.indexOf('#eeedee')).toBeLessThan(
      html.indexOf('--bronze:#C08A3E')
    )
  })
})
