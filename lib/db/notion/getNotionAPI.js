import { NotionAPI as NotionLibrary } from 'notion-client'
import BLOG from '@/blog.config'
import path from 'path'
import { RateLimiter } from './RateLimiter'
import {
  getNotionBuildRateMaxPerMinute,
  getNotionBuildRateMinIntervalMs,
  logBuildEnvSummary
} from '@/lib/build/buildEnv'

// 限流配置：构建期限制频率避免接口频繁；
// 运行时同样启用(参数更宽松、单进程无需文件锁),
// 防止缓存失效后的回源突发打满 Notion 配额引发 429
const isBuildPhase = process.env.BUILD_MODE || process.env.EXPORT
const lockFilePath = path.resolve(process.cwd(), '.notion-api-lock')

const runtimeMaxPerMinute = Number.parseInt(
  process.env.NOTION_RUNTIME_RATE_MAX_PER_MINUTE || '',
  10
)
const runtimeMinIntervalMs = Number.parseInt(
  process.env.NOTION_RUNTIME_RATE_MIN_INTERVAL_MS || '',
  10
)

const rateLimiter = isBuildPhase
  ? new RateLimiter(
      getNotionBuildRateMaxPerMinute(),
      lockFilePath,
      getNotionBuildRateMinIntervalMs()
    )
  : new RateLimiter(
      Number.isFinite(runtimeMaxPerMinute) ? runtimeMaxPerMinute : 180,
      undefined,
      Number.isFinite(runtimeMinIntervalMs) ? runtimeMinIntervalMs : 50,
      // 运行时给 3 个并发槽:纯串行会把 ISR 回源压成单线程
      Number.isFinite(Number.parseInt(process.env.NOTION_RUNTIME_RATE_CONCURRENCY || '', 10))
        ? Number.parseInt(process.env.NOTION_RUNTIME_RATE_CONCURRENCY || '', 10)
        : 3
    )
if (isBuildPhase) {
  logBuildEnvSummary()
}

const globalStore = { notion: null, inflight: new Map() }

function getRawNotion() {
  if (!globalStore.notion) {
    globalStore.notion = new NotionLibrary({
      apiBaseUrl: BLOG.API_BASE_URL || 'https://www.notion.so/api/v3',
      activeUser: BLOG.NOTION_ACTIVE_USER || null,
      authToken: BLOG.NOTION_TOKEN_V2 || null,
      userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      kyOptions: {
        mode: 'cors',
        hooks: {
          beforeRequest: [
            (request) => {
              const url = request.url.toString()
              if (url.includes('/api/v3/syncRecordValues')) {
                return new Request(
                  url.replace('/api/v3/syncRecordValues', '/api/v3/syncRecordValuesMain'),
                  request
                )
              }
              return request
            }
          ]
        }
      }
    })
  }
  return globalStore.notion
}

async function callNotion(methodName, ...args) {
  const notion = getRawNotion()
  const original = notion[methodName]
  if (typeof original !== 'function') throw new Error(`${methodName} is not a function`)

  const key = `${methodName}-${JSON.stringify(args)}`

  if (globalStore.inflight.has(key)) return globalStore.inflight.get(key)

  // 注意：原函数已返回 Promise，不需要再 async 包一层
  const execute = () => original.apply(notion, args)
  const promise = rateLimiter.enqueue(key, execute)

  globalStore.inflight.set(key, promise)
  // 始终把 inflight 清掉；即便上层不消费 reject 也不抛 unhandledRejection
  promise
    .catch(() => {})
    .finally(() => globalStore.inflight.delete(key))
  return promise
}

export const notionAPI = {
  getPage: (...args) => callNotion('getPage', ...args),
  getBlocks: (...args) => callNotion('getBlocks', ...args),
  getSignedFileUrls: (...args) => callNotion('getSignedFileUrls', ...args),
  getUsers: (...args) => callNotion('getUsers', ...args),
  __call: callNotion
}

export default notionAPI
