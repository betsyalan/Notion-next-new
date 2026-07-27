import { notionTextColorClass } from '@/themes/next/notion-color'

describe('notionTextColorClass', () => {
  it('常规颜色直接映射', () => {
    expect(notionTextColorClass('blue')).toBe('notion-blue')
    expect(notionTextColorClass('red')).toBe('notion-red')
  })

  it('green 映射为 teal(样式表中无 .notion-green 文字类)', () => {
    expect(notionTextColorClass('green')).toBe('notion-teal')
  })

  it('default 与空值回退 gray', () => {
    expect(notionTextColorClass('default')).toBe('notion-gray')
    expect(notionTextColorClass(undefined)).toBe('notion-gray')
    expect(notionTextColorClass('')).toBe('notion-gray')
  })
})
