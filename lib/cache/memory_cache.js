import cache from 'memory-cache'
import BLOG from '@/blog.config'

const cacheTime = BLOG.isProd ? 10 * 60 : 120 * 60 // 120 minutes for dev,10 minutes for prod

export async function getCache(key, options) {
  return await cache.get(key)
}

export async function setCache(key, data, customCacheTime) {
  await cache.put(key, data, (customCacheTime || cacheTime) * 1000)
}

export async function delCache(key) {
  await cache.del(key)
}

/** 清空全部 memory 缓存(供缓存清理 API 调用;memory-cache 自带 clear) */
export async function cleanCache() {
  await cache.clear()
}

export default { getCache, setCache, delCache, cleanCache }
