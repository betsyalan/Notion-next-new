import { render, screen } from '@testing-library/react'
import NotionIcon from '@/components/NotionIcon'

describe('NotionIcon', () => {
  it('emoji 直接渲染为文本', () => {
    const { container } = render(<NotionIcon icon='🎉' />)
    expect(screen.getByText('🎉')).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })

  it('http 图片地址渲染为 img', () => {
    const { container } = render(
      <NotionIcon icon='https://www.notion.so/icons/x.svg?t=abc' />
    )
    expect(container.querySelector('img')).toBeInTheDocument()
  })

  it('notion:// 自定义图标协议不渲染任何内容', () => {
    const { container } = render(
      <NotionIcon icon='notion://custom_emoji/70e78a87-9d37-40fd-9b89-926d36757895/3aa030b6-7e71-80e1-a284-007a02497da7?t=abc' />
    )
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText(/custom_emoji/)).not.toBeInTheDocument()
  })

  it('空值不渲染', () => {
    const { container } = render(<NotionIcon icon='' />)
    expect(container).toBeEmptyDOMElement()
  })
})
