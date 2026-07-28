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

describe('next 主题现代简约覆盖层', () => {
  it('CONFIG 默认开启 NEXT_STYLE_EDITORIAL', () => {
    expect(CONFIG.NEXT_STYLE_EDITORIAL).toBe(true)
  })

  it('开启时输出设计令牌,且不加载任何网络字体', () => {
    editorialFlag = true
    const html = renderToStaticMarkup(<Style />)
    expect(html).toContain('--blue:#2563eb')
    // 系统无衬线栈,无网络字体链接(中文 webfont 体积大会阻塞首屏)
    expect(html).toContain('--sans:"PingFang SC"')
    expect(html).not.toContain('fonts.googleapis.com')
    expect(html).not.toContain('<link')
    expect(html).toContain('--bg:#f8fafc')
  })

  it('关闭时不输出现代简约覆盖层', () => {
    editorialFlag = false
    const html = renderToStaticMarkup(<Style />)
    expect(html).not.toContain('--navy')
    // 原有样式仍在
    expect(html).toContain('#theme-next .menu-link')
  })

  it('开启时包含全局与顶栏覆盖规则', () => {
    editorialFlag = true
    const html = renderToStaticMarkup(<Style />)
    expect(html).toContain('#theme-next > div.bg-gray-700')
    expect(html).toContain('#top-nav #sticky-nav > div.bg-black')
    // Logo 块底色与主页一致(--bg),不再使用宣纸渐变
    expect(html).toContain('#theme-next #left .bg-black')
    expect(html).not.toContain('linear-gradient(165deg')
    expect(html).toContain('.logo::after')
    // 防回归:模板字符串中的 \: 需写成 \\: 才能保留反斜杠
    expect(html).toContain('hover\\:shadow-xl')
  })

  it('开启时包含文章卡与侧栏覆盖规则', () => {
    editorialFlag = true
    const html = renderToStaticMarkup(<Style />)
    expect(html).toContain('#posts-wrapper a.text-3xl')
    // 文章卡标题显式 700(避免继承根节点字重导致标题偏细)
    expect(html).toContain('font-weight: 700')
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
    expect(html).toContain('--bg:#0f172a')
    expect(html).toContain('.dark body')
    expect(html).toContain('.dark\\:bg-hexo-black-gray')
    // 暗色 Notion 选项色调色板(标签/分类徽章暗色下仍显色)
    expect(html).toContain('--notion-blue_background: rgb(54,73,84)')
    // 标签云不再强制灰字(由组件输出 Notion 选项色)
    expect(html).not.toContain('#tags-group a {\n    background-color: transparent')
    // 暗色下文章列表标题 hover 变蓝
    expect(html).toContain(
      'a.text-3xl:hover .menu-link { color: var(--blue); }'
    )
  })

  it('覆盖层 style 输出在原样式块之后', () => {
    editorialFlag = true
    const html = renderToStaticMarkup(<Style />)
    expect(html.indexOf('#eeedee')).toBeLessThan(
      html.indexOf('--blue:#2563eb')
    )
  })
})
