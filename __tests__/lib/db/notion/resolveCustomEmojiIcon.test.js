import { resolveCustomEmojiIcon } from '@/lib/db/notion/mapImage'

const EMOJI_ID = '3aa030b6-7e71-80e1-a284-007a02497da7'
const SPACE_ID = '70e78a87-9d37-40fd-9b89-926d36757895'
const REAL_URL =
  'https://s3-us-west-2.amazonaws.com/public.notion-static.com/5c01e1a1-cda5-45e9-8172-d9f7c93c356e/icon.png'

describe('resolveCustomEmojiIcon', () => {
  it('命中 custom_emoji 表时返回真实图片地址', () => {
    const icon = `notion://custom_emoji/${SPACE_ID}/${EMOJI_ID}?t=abc123`
    const map = {
      [EMOJI_ID]: { spaceId: SPACE_ID, value: { value: { url: REAL_URL } } }
    }
    expect(resolveCustomEmojiIcon(icon, map)).toBe(REAL_URL)
  })

  it('兼容拍平后的 value.url 单层结构', () => {
    const icon = `notion://custom_emoji/${SPACE_ID}/${EMOJI_ID}`
    const map = { [EMOJI_ID]: { value: { url: REAL_URL } } }
    expect(resolveCustomEmojiIcon(icon, map)).toBe(REAL_URL)
  })

  it('非 notion:// 图标原样返回', () => {
    expect(resolveCustomEmojiIcon('🎉', {})).toBe('🎉')
    expect(
      resolveCustomEmojiIcon('https://www.notion.so/icons/x.svg', {})
    ).toBe('https://www.notion.so/icons/x.svg')
    expect(resolveCustomEmojiIcon('', {})).toBe('')
    expect(resolveCustomEmojiIcon(undefined, {})).toBe(undefined)
  })

  it('映射表缺失或未命中时返回原值（交由渲染层忽略）', () => {
    const icon = `notion://custom_emoji/${SPACE_ID}/${EMOJI_ID}`
    expect(resolveCustomEmojiIcon(icon, undefined)).toBe(icon)
    expect(resolveCustomEmojiIcon(icon, {})).toBe(icon)
    expect(resolveCustomEmojiIcon(icon, { [EMOJI_ID]: {} })).toBe(icon)
  })
})
