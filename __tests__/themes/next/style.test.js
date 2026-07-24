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
