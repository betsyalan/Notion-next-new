import { siteConfig } from '@/lib/config'
import TagItemMini from './TagItemMini'
import CONFIG from '../config'

/**
 * 标签组
 * @param tags
 * @param currentTag
 * @returns {JSX.Element}
 * @constructor
 */
const TagGroups = ({ tags, currentTag }) => {
  if (!tags || tags.length === 0) return <></>

  // 不传 CONFIG 时取不到主题默认值会返回 null,slice(0, null) 导致分组为空
  const tagsCount = siteConfig('NEXT_PREVIEW_TAG_COUNT', null, CONFIG)
  const tagOptions = tagsCount ? tags.slice(0, tagsCount) : tags
  return (
    <div id='tags-group' className='dark:border-gray-600 w-66 space-y-2'>
      {tagOptions.map(tag => {
        const selected = tag.name === currentTag
        return <TagItemMini key={tag.name} tag={tag} selected={selected} />
      })}
    </div>
  )
}

export default TagGroups
