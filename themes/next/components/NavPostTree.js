import Collapse from '@/components/Collapse'
import NotionIcon from '@/components/NotionIcon'
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
  // 惰性初始化：首帧即展开当前文章所在分组（未命中回退第一个分类），
  // 避免 SSR 全折叠、客户端再展开造成的闪烁
  const [expandedGroups, setExpandedGroups] = useState(() => [
    getDefaultOpenIndexByPath(folders, currentPath)
  ])

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
        } ${currentPath === post.href ? 'font-bold text-red-400' : ''}`}
      >
        {/* pageIcon 可能是 emoji 也可能是图片 URL，交给 NotionIcon 渲染；
            包装 span 把图片图标约束到文字尺寸 */}
        <span className='[&_img]:w-4 [&_img]:h-4'>
          <NotionIcon icon={post.pageIcon} />
        </span>
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
              className='cursor-pointer flex justify-between items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300'
            >
              <span
                className={expandedGroups.includes(index) ? 'font-bold' : ''}
              >
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
              onHeightChange={onHeightChange}
            >
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
