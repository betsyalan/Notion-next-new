import { siteConfig } from '@/lib/config'
import SmartLink from '@/components/SmartLink'
import { notionTextColorClass } from '../notion-color'
import CONFIG from '../config'

const CategoryGroup = ({ currentCategory, categories }) => {
  if (!categories || categories.length === 0) return <></>
  // 不传 CONFIG 时取不到主题默认值会返回 null,slice(0, null) 导致分组为空
  const categoryCount = siteConfig('NEXT_PREVIEW_CATEGORY_COUNT', null, CONFIG)
  const categoryOptions = categoryCount
    ? categories.slice(0, categoryCount)
    : categories
  return (
    <>
      <div id='category-list' className='dark:border-gray-600 flex flex-wrap'>
        {categoryOptions.map(category => {
          const selected = currentCategory === category.name
          return (
            <SmartLink
              key={category.name}
              href={`/category/${category.name}`}
              passHref
              className={
                (selected
                  ? 'hover:text-white dark:hover:text-white bg-gray-600 text-white '
                  : 'dark:text-gray-400 text-gray-500 hover:text-white hover:bg-gray-500 dark:hover:text-white') +
                '  group text-sm w-full items-center duration-300 px-2  cursor-pointer py-1 font-light'
              }>
              <i
                className={`${selected ? 'text-white fa-folder-open ' : 'text-gray-500 fa-folder '} mr-2 fas`}
              />
              <span
                className={
                  selected
                    ? ''
                    : `${notionTextColorClass(category.color)} group-hover:text-white`
                }>
                {category.name}({category.count})
              </span>
            </SmartLink>
          )
        })}
      </div>
    </>
  )
}

export default CategoryGroup
