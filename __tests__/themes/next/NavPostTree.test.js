import { fireEvent, render, screen } from '@testing-library/react'
import NavPostTree, {
  getDefaultOpenIndexByPath,
  groupArticles
} from '@/themes/next/components/NavPostTree'

// 覆盖 jest.setup.js 中的全局 router mock：当前路径为 /post-2
jest.mock('next/router', () => ({
  useRouter: () => ({ asPath: '/post-2' })
}))

const mockPosts = [
  { id: '1', title: '文章一', href: '/post-1', category: '前端' },
  { id: '2', title: '文章二', href: '/post-2', category: '前端' },
  { id: '3', title: '文章三', href: '/post-3', category: '后端' },
  { id: '4', title: '无分类文章', href: '/post-4', category: '' }
]

describe('groupArticles', () => {
  it('按分类分组并保持传入顺序', () => {
    const groups = groupArticles(mockPosts)
    expect(groups).toHaveLength(3)
    expect(groups[0].category).toBe('前端')
    expect(groups[0].items.map(p => p.id)).toEqual(['1', '2'])
    expect(groups[1].category).toBe('后端')
    expect(groups[2].category).toBe('')
    expect(groups[2].items[0].title).toBe('无分类文章')
  })

  it('空输入返回空数组', () => {
    expect(groupArticles(null)).toEqual([])
    expect(groupArticles(undefined)).toEqual([])
    expect(groupArticles([])).toEqual([])
  })
})

describe('getDefaultOpenIndexByPath', () => {
  const folders = groupArticles(mockPosts)

  it('命中当前路径所在分组', () => {
    expect(getDefaultOpenIndexByPath(folders, '/post-3')).toBe(1)
    expect(getDefaultOpenIndexByPath(folders, '/post-2')).toBe(0)
  })

  it('未命中返回 0', () => {
    expect(getDefaultOpenIndexByPath(folders, '/not-exist')).toBe(0)
  })
})

describe('NavPostTree 组件', () => {
  it('渲染分类分组头与文章链接', () => {
    render(<NavPostTree allNavPages={mockPosts} />)
    expect(screen.getByText('前端')).toBeInTheDocument()
    expect(screen.getByText('后端')).toBeInTheDocument()
    expect(screen.getByText('文章一')).toBeInTheDocument()
    expect(screen.getByText('文章三')).toBeInTheDocument()
    // 无分类文章平铺在顶层
    expect(screen.getByText('无分类文章')).toBeInTheDocument()
  })

  it('当前文章高亮且所在分组默认展开', () => {
    render(<NavPostTree allNavPages={mockPosts} />)
    const activeLink = screen.getByText('文章二').closest('a')
    expect(activeLink).toHaveClass('font-bold')
    // 当前文章在「前端」组（索引 0），其 chevron 应为展开态
    const chevrons = document.querySelectorAll('.fa-chevron-left')
    expect(chevrons[0]).toHaveClass('-rotate-90')
    expect(chevrons[1]).not.toHaveClass('-rotate-90')
  })

  it('手风琴式排他折叠：点击另一分组后仅该分组展开', () => {
    render(<NavPostTree allNavPages={mockPosts} />)
    fireEvent.click(screen.getByText('后端'))
    const chevrons = document.querySelectorAll('.fa-chevron-left')
    expect(chevrons[1]).toHaveClass('-rotate-90')
    expect(chevrons[0]).not.toHaveClass('-rotate-90')
  })

  it('空数据不渲染任何内容', () => {
    const { container } = render(<NavPostTree allNavPages={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
