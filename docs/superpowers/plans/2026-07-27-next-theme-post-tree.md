# next 主题左侧文章树（NavPostTree）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 next 主题左侧栏新增"分类→文章"两层文章树（桌面端独立卡片常驻 + 移动端汉堡菜单内），支持手风琴折叠与当前文章高亮。

**Architecture:** 新建 `themes/next/components/NavPostTree.js`（参照 gitbook 主题 `NavPostList`/`NavPostItem` 移植），数据直接用 Layout 已有 props `allNavPages`，不改数据层；通过 `NEXT_LEFT_POST_TREE` 配置开关接入 `SideAreaLeft`（桌面）与 `TopNav`（移动端）。

**Tech Stack:** Next.js 14 Pages Router、React 18、Tailwind CSS 3、Jest 29 + @testing-library/react。

**规格文档:** `docs/superpowers/specs/2026-07-27-next-theme-post-tree-design.md`

## Global Constraints

- 包管理只用 `yarn`，禁止 `npm`/`pnpm`。
- 代码风格：Prettier——单引号、不加分号、无尾逗号、`arrowParens: avoid`、行宽 80。
- 代码注释用中文，与现有代码一致。
- Pages Router 项目，禁止 App Router 写法。
- 提交信息用 Conventional Commits：`feat|fix|docs|test(scope): 描述`。
- 改动仅限 `themes/next/`、`__tests__/themes/next/`、`docs/user-guide/themes/next.md`，不碰其他主题。
- **设计细化（相对规格）**：无分类文章不设「未分类」文件夹，参照 gitbook `NavPostItem` 的 else 分支平铺在树顶层（`lib/lang` 无对应 locale 键，避免新增文案键）。
- 文章顺序保持 `allNavPages` 传入顺序（上游已按发布日期倒序），组件内不额外排序。

## 关键既有事实（实现者无需重新探索）

- `LayoutBase`（`themes/next/index.js:144,162`）用 `{...props}` 向 `TopNav` 与 `SideAreaLeft` 透传全部 props，`allNavPages` 已在其中，**无需改 `index.js`**。
- `Collapse`（`components/Collapse.js`）props：`{ type='vertical', isOpen, onHeightChange, className, collapseRef }`；children 始终渲染在 DOM 中（仅高度动画）。
- `jest.setup.js` 已全局 mock `next/router`（`asPath: '/'`），测试文件内可用自己的 `jest.mock('next/router', ...)` 覆盖。
- 高亮样式参照 `themes/next/components/Toc.js:94`：`font-bold text-red-400`。
- `SideAreaLeft` sticky 区现有结构：`<div className='sticky top-4 ...'>` 内一个 `<Card><Tabs/></Card>` + slot 区（`themes/next/components/SideAreaLeft.js:48-86`）。
- `Card`（`themes/next/components/Card.js`）props：`{ children, headerSlot, className }`，`className` 作用于外层包裹 div。
- `TopNav` 移动端菜单：`themes/next/components/TopNav.js:159-161` 的 `<Collapse collapseRef={collapseRef} type='vertical' isOpen={isOpen}>` 包裹 `<MenuList onHeightChange={...} {...props} from='top' />`。

---

### Task 1: NavPostTree 组件（TDD）

**Files:**
- Create: `themes/next/components/NavPostTree.js`
- Test: `__tests__/themes/next/NavPostTree.test.js`

**Interfaces:**
- Consumes: `@/components/Collapse`、`@/components/SmartLink`、`next/router` 的 `useRouter`
- Produces:
  - 默认导出 `NavPostTree({ allNavPages, onHeightChange, className })`——`allNavPages` 为文章数组（元素含 `id/title/href/category/pageIcon`），`onHeightChange` 可选（供外层 Collapse 更新高度），`className` 可选追加类名；空数据返回 `null`。
  - 命名导出 `groupArticles(allNavPages): Array<{ category: string, items: Array }>`（`null`/无分类归 `category: ''` 组）
  - 命名导出 `getDefaultOpenIndexByPath(folders, path): number`（找不到返回 0）

- [ ] **Step 1: 写失败测试**

创建 `__tests__/themes/next/NavPostTree.test.js`：

```js
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `yarn jest __tests__/themes/next/NavPostTree.test.js`
Expected: FAIL（模块 `NavPostTree` 不存在）

- [ ] **Step 3: 实现组件**

创建 `themes/next/components/NavPostTree.js`：

```js
import Collapse from '@/components/Collapse'
import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

/**
 * 左侧栏文章树：分类 → 文章 两层结构
 * 参照 gitbook 主题 NavPostList 移植，样式贴合 next 主题
 * @param {allNavPages, onHeightChange, className} props
 */
const NavPostTree = ({ allNavPages, onHeightChange, className = '' }) => {
  const router = useRouter()
  const currentPath = decodeURIComponent((router.asPath || '/').split('?')[0])
  const folders = groupArticles(allNavPages)

  // 存放被展开的分组索引（手风琴：一次只展开一个）
  const [expandedGroups, setExpandedGroups] = useState([])

  // 路由变化时自动展开当前文章所在分组
  useEffect(() => {
    const index = getDefaultOpenIndexByPath(folders, currentPath)
    setExpandedGroups(prev =>
      prev.length === 1 && prev[0] === index ? prev : [index]
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, allNavPages])

  // 手风琴式排他折叠：展开新分组时收起其余分组
  const toggleItem = index => {
    setExpandedGroups(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [index]
    )
  }

  if (!folders || folders.length === 0) {
    return null
  }

  // 单篇文章链接（当前文章高亮，参照 Toc 的 font-bold text-red-400）
  const renderPostLink = (post, indent) => {
    const link = (
      <SmartLink
        href={post.href}
        className={`block py-1.5 truncate dark:text-gray-400 hover:text-black dark:hover:text-white ${
          indent ? 'pl-3' : 'px-2'
        } ${currentPath === post.href ? 'font-bold text-red-400' : ''}`}>
        {post.pageIcon && <span className='mr-1'>{post.pageIcon}</span>}
        {post.title}
      </SmartLink>
    )
    if (!indent) {
      return link
    }
    return (
      <div className='ml-3 border-l border-gray-200 dark:border-gray-700'>
        {link}
      </div>
    )
  }

  return (
    <nav className={`overflow-y-auto max-h-96 text-sm ${className}`}>
      {folders.map((group, index) =>
        group.category ? (
          <div key={group.category}>
            {/* 分组头：点击折叠/展开 */}
            <div
              onClick={() => toggleItem(index)}
              className='cursor-pointer flex justify-between items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300'>
              <span
                className={expandedGroups.includes(index) ? 'font-bold' : ''}>
                {group.category}
              </span>
              <i
                className={`px-2 fas fa-chevron-left transition-all duration-300 opacity-50 ${
                  expandedGroups.includes(index) ? '-rotate-90' : ''
                }`}
              />
            </div>
            {/* 分组内文章 */}
            <Collapse
              isOpen={expandedGroups.includes(index)}
              onHeightChange={onHeightChange}>
              {group.items.map(post => (
                <div key={post.id}>{renderPostLink(post, true)}</div>
              ))}
            </Collapse>
          </div>
        ) : (
          // 无分类文章：平铺在树顶层，不带折叠文件夹
          group.items.map(post => (
            <div key={post.id}>{renderPostLink(post, false)}</div>
          ))
        )
      )}
    </nav>
  )
}

// 按分类分组，无分类归入 category 为 '' 的组，保持传入顺序
function groupArticles(allNavPages) {
  if (!allNavPages) {
    return []
  }
  const groups = []
  for (const item of allNavPages) {
    const categoryName = item?.category ? item.category : ''
    const existing = groups.find(g => g.category === categoryName)
    if (existing) {
      existing.items.push(item)
    } else {
      groups.push({ category: categoryName, items: [item] })
    }
  }
  return groups
}

// 当前路由需要展开的分组索引，未命中返回 0（默认展开第一个）
function getDefaultOpenIndexByPath(folders, path) {
  const index = folders.findIndex(group =>
    group.items.some(post => path === post.href)
  )
  return index === -1 ? 0 : index
}

export { getDefaultOpenIndexByPath, groupArticles }
export default NavPostTree
```

- [ ] **Step 4: 跑测试确认通过**

Run: `yarn jest __tests__/themes/next/NavPostTree.test.js`
Expected: PASS（全部 7 个用例）

- [ ] **Step 5: 格式化 + lint**

Run: `yarn prettier --write themes/next/components/NavPostTree.js __tests__/themes/next/NavPostTree.test.js && yarn lint`
Expected: 无 error

- [ ] **Step 6: Commit**

```bash
git add themes/next/components/NavPostTree.js __tests__/themes/next/NavPostTree.test.js
git commit -m "feat(next): 新增左侧栏文章树组件 NavPostTree"
```

---

### Task 2: 配置开关 + SideAreaLeft 桌面端接入

**Files:**
- Modify: `themes/next/config.js:29-30`（`NEXT_MENU_SEARCH` 之后）
- Modify: `themes/next/components/SideAreaLeft.js`

**Interfaces:**
- Consumes: Task 1 的 `NavPostTree` 默认导出；`allNavPages` 经 `{...props}` 已由 `LayoutBase` 透传，直接读 `props.allNavPages`。
- Produces: 配置键 `NEXT_LEFT_POST_TREE`（布尔，默认 `true`），供 Task 3 复用同一读取方式 `siteConfig('NEXT_LEFT_POST_TREE', true, CONFIG)`。

- [ ] **Step 1: 加配置项**

`themes/next/config.js` 在 `NEXT_MENU_SEARCH: true, // 显示搜索` 之后插入：

```js

  // 左侧栏
  NEXT_LEFT_POST_TREE: true, // 左侧栏文章树（分类→文章两层，桌面端独立卡片+移动端汉堡菜单）
```

- [ ] **Step 2: SideAreaLeft 接入**

`themes/next/components/SideAreaLeft.js`：

import 区（第 11 行 `import Toc from './Toc'` 之后）加：

```js
import NavPostTree from './NavPostTree'
```

sticky 区现有 `</Card>`（第 80 行）之后、`<div className='flex justify-center'>`（第 82 行）之前插入：

```js
        {siteConfig('NEXT_LEFT_POST_TREE', true, CONFIG) && (
          <Card className='mt-5'>
            <NavPostTree allNavPages={props.allNavPages} />
          </Card>
        )}
```

- [ ] **Step 3: 验证**

Run: `yarn lint && yarn type-check && yarn jest __tests__/themes/next/`
Expected: 全部通过（type-check 覆盖 js 因 `allowJs: true`）

- [ ] **Step 4: Commit**

```bash
git add themes/next/config.js themes/next/components/SideAreaLeft.js
git commit -m "feat(next): 左侧栏接入文章树卡片并新增 NEXT_LEFT_POST_TREE 开关"
```

---

### Task 3: TopNav 移动端接入

**Files:**
- Modify: `themes/next/components/TopNav.js`

**Interfaces:**
- Consumes: Task 1 的 `NavPostTree`；Task 2 的配置键 `NEXT_LEFT_POST_TREE`。
- Produces: 无新接口。

- [ ] **Step 1: TopNav 接入**

`themes/next/components/TopNav.js`：

import 区（第 7 行 `import { MenuList } from './MenuList'` 之后）加：

```js
import NavPostTree from './NavPostTree'
```

`TopNav.js:159-161` 的折叠菜单改为（在 `<MenuList ... />` 之后追加文章树）：

```js
                <Collapse collapseRef={collapseRef} type='vertical' isOpen={isOpen}>
                    <MenuList onHeightChange={(param) => collapseRef.current?.updateCollapseHeight(param)} {...props} from='top' />
                    {siteConfig('NEXT_LEFT_POST_TREE', true, CONFIG) && (
                        <div className='px-4 pb-4 bg-white dark:bg-gray-800'>
                            <NavPostTree
                                allNavPages={props.allNavPages}
                                onHeightChange={(param) => collapseRef.current?.updateCollapseHeight(param)}
                            />
                        </div>
                    )}
                </Collapse>
```

说明：`onHeightChange` 透传给外层 `collapseRef`，保证文章树展开时汉堡菜单总高度同步更新（与 `MenuList` 现有做法一致）。

- [ ] **Step 2: 验证**

Run: `yarn lint && yarn type-check && yarn test`
Expected: 全部通过

- [ ] **Step 3: Commit**

```bash
git add themes/next/components/TopNav.js
git commit -m "feat(next): 移动端汉堡菜单接入文章树"
```

---

### Task 4: 文档 + 全量验证

**Files:**
- Modify: `docs/user-guide/themes/next.md`

**Interfaces:**
- Consumes: Task 2 的配置键 `NEXT_LEFT_POST_TREE`。
- Produces: 无。

- [ ] **Step 1: 更新主题文档**

在 `docs/user-guide/themes/next.md` 中找到主题配置项说明的段落（对照 `themes/next/config.js` 的既有配置说明位置），补充一行：

```markdown
| `NEXT_LEFT_POST_TREE` | 左侧栏文章树（分类→文章两层，桌面端独立卡片、移动端在汉堡菜单内） | `true` |
```

若该文件用的是列表而非表格，按既有格式改写为对应条目；并遵循 `docs/DOCUMENTATION_POLICY.md`（不写个人 `.env` 或私有 ID）。

- [ ] **Step 2: 全量验证**

Run: `yarn format:check && yarn lint && yarn type-check && yarn test`
Expected: 全部通过。若 `format:check` 失败，先 `yarn prettier --write` 改动文件后重跑。

- [ ] **Step 3: Commit**

```bash
git add docs/user-guide/themes/next.md
git commit -m "docs(user-guide): next 主题补充 NEXT_LEFT_POST_TREE 配置说明"
```
