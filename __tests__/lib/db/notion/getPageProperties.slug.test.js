import getPageProperties from '@/lib/db/notion/getPageProperties'

// notion-utils 是 ESM 包，jest 无法直接加载；本测试只用到这两个函数的简单行为
jest.mock('notion-utils', () => ({
  getTextContent: arr => (Array.isArray(arr) ? arr.flat().join('') : arr),
  getDateValue: () => null
}))

// notion-client 同为 ESM，本测试不触发 person 字段请求
jest.mock('@/lib/db/notion/getNotionAPI', () => ({
  __esModule: true,
  default: { getUsers: jest.fn() }
}))

// 最小可用的行数据
const buildValue = slugValue => ({
  id: 'x',
  created_time: 1700000000000,
  last_edited_time: 1700000000000,
  properties: {
    'd]hq': [[slugValue]],
    title: [['测试文章']],
    'f211bdc0-ee00-4186-9a7d-f68c055ec2ee': [['Published']],
    '`gQ~': [['Post']]
  },
  format: {}
})

const PAGE_ID = '3a7030b6-7e71-8062-a21c-c33221b4262b'

describe('getPageProperties slug 处理', () => {
  it('slug 列为公式类型时忽略缓存值，本地生成 page+id', async () => {
    const schema = {
      'd]hq': { name: 'slug', type: 'formula' },
      title: { name: 'title', type: 'title' },
      'f211bdc0-ee00-4186-9a7d-f68c055ec2ee': {
        name: 'status',
        type: 'select'
      },
      '`gQ~': { name: 'type', type: 'select' }
    }
    // 公式列返回的是服务端缓存旧值 net，应被忽略
    const props = await getPageProperties(PAGE_ID, buildValue('net'), schema)
    expect(props.slug).toBe('page3a7030b67e718062a21cc33221b4262b')
  })

  it('slug 列为文本类型时保持原值', async () => {
    const schema = {
      'd]hq': { name: 'slug', type: 'text' },
      title: { name: 'title', type: 'title' },
      'f211bdc0-ee00-4186-9a7d-f68c055ec2ee': {
        name: 'status',
        type: 'select'
      },
      '`gQ~': { name: 'type', type: 'select' }
    }
    const props = await getPageProperties(PAGE_ID, buildValue('net'), schema)
    expect(props.slug).toBe('net')
  })
})
