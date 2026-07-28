import BLOG from '@/blog.config'
import { getDataFromCache } from '@/lib/cache/cache_manager'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { DynamicLayout } from '@/themes/theme'
import { getPageContentText } from '@/lib/db/notion/getPageContentText'
import { getPageBlockCacheKey } from '@/lib/db/notion/getPostBlocks'

const Index = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutSearch' {...props} />
}

/**
 * 服务端搜索
 * @param {*} param0
 * @returns
 */
export async function getStaticProps({ params: { keyword }, locale }) {
  const props = await fetchGlobalAllData({
    from: 'search-props',
    locale
  })
  const { allPages } = props
  const allPosts = allPages?.filter(
    page => page.type === 'Post' && page.status === 'Published'
  )
  props.posts = await filterByMemCache(allPosts, keyword)
  props.postCount = props.posts.length
  // allPages 体量大且已用不到,避免随 props 重复序列化下发
  delete props.allPages
  const POST_LIST_STYLE = siteConfig(
    'POST_LIST_STYLE',
    'Page',
    props?.NOTION_CONFIG
  )
  const POSTS_PER_PAGE = siteConfig('POSTS_PER_PAGE', 12, props?.NOTION_CONFIG)

  // 处理分页
  if (POST_LIST_STYLE === 'scroll') {
    // 滚动列表默认给前端返回所有数据
  } else if (POST_LIST_STYLE) {
    props.posts = props.posts?.slice(0, POSTS_PER_PAGE)
  }
  props.keyword = keyword
  return {
    props,
    revalidate: process.env.EXPORT
      ? undefined
      : siteConfig(
          'NEXT_REVALIDATE_SECOND',
          BLOG.NEXT_REVALIDATE_SECOND,
          props.NOTION_CONFIG
        )
  }
}

export function getStaticPaths() {
  return {
    paths: [{ params: { keyword: 'NotionNext' } }],
    fallback: true
  }
}

/**
 * 在内存缓存中进行全文索引
 * @param {*} allPosts
 * @param keyword 关键词
 * @returns
 */
async function filterByMemCache(allPosts, keyword) {
  const filterPosts = []
  if (keyword) {
    keyword = keyword.trim().toLowerCase()
  }
  for (const post of allPosts) {
    const cacheKey = getPageBlockCacheKey(post.id, post.lastEditedDate)
    const page = await getDataFromCache(cacheKey, true)
    const tagContent =
      post?.tags && Array.isArray(post?.tags) ? post?.tags.join(' ') : ''
    const categoryContent =
      post.category && Array.isArray(post.category)
        ? post.category.join(' ')
        : ''
    const articleInfo = post.title + post.summary + tagContent + categoryContent
    let hit = articleInfo.toLowerCase().indexOf(keyword) > -1
    const contentText = getPageContentText(post, page)
    // 正文命中:截取命中处上下文作为摘要片段(主题按 post.results 数组渲染)
    const results = []
    if (contentText) {
      const index = contentText.toLowerCase().indexOf(keyword)
      if (index > -1) {
        hit = true
        const start = Math.max(0, index - 60)
        results.push(contentText.slice(start, index + keyword.length + 80))
      }
    }
    if (hit) {
      // 浅拷贝再挂 results,避免污染缓存层共享的文章对象
      filterPosts.push({ ...post, results })
    }
  }
  return filterPosts
}

export default Index
