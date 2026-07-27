import LazyImage from './LazyImage'

/**
 * notion的图标icon
 * 可能是emoji 可能是 svg 也可能是 图片
 * @returns
 */
const NotionIcon = ({ icon }) => {
  if (!icon) {
    return <></>
  }

  if (icon.startsWith('http') || icon.startsWith('data:')) {
    return <LazyImage src={icon} width={32} height={32} className='w-8 h-8 my-auto inline mr-1'/>
  }

  // 手动上传的自定义图标是 notion://custom_emoji/... 这类私有协议地址，
  // 浏览器无法加载，渲染原文会显示一长串乱码，此处直接忽略
  if (icon.includes('://') || icon.includes('/')) {
    return <></>
  }

  return <span className='mr-1'>{icon}</span>
}

export default NotionIcon
