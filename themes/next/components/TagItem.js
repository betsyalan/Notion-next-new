import SmartLink from '@/components/SmartLink'
import { useGlobal } from '@/lib/global'
import { notionTextColorClass } from '../notion-color'

const TagItem = ({ tag, selected }) => {
  const { locale } = useGlobal()
  if (!tag) {
    <div> {locale.COMMON.NOTAG} </div>
  }
  return (
    <SmartLink
      href={selected ? '/' : `/tag/${encodeURIComponent(tag.name)}`}
      passHref
      legacyBehavior>
      <li
        className={`notion-${tag.color}_background list-none cursor-pointer rounded-md
        duration-200 mr-1 my-1 px-2 py-1 text-sm whitespace-nowrap
        hover:bg-gray-200 dark:hover:bg-gray-800 ${selected ? 'ring-1 ring-current' : ''}`}>
        <div className={`${notionTextColorClass(tag.color)} dark:hover:text-white`}>
          <i className='fas fa-tag mr-1' /> {`${tag.name} `}{' '}
          {tag.count ? `(${tag.count})` : ''}
        </div>
      </li>
    </SmartLink>
  )
}

export default TagItem
