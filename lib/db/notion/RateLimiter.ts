import fs from 'fs'

interface QueueItem<T> {
  key: string
  requestFunc: () => Promise<T>
  resolve: (value: T) => void
  reject: (err: unknown) => void
}

interface NodeError extends Error {
  code?: string
}

export class RateLimiter {
  private queue: QueueItem<unknown>[] = []
  private pending = new Map<string, Promise<unknown>>()
  private activeCount = 0
  private lastRequestTime = 0
  private requestCount = 0
  private windowStart = Date.now()

  constructor(
    private maxRequestsPerMinute = 200,
    private lockFilePath?: string,
    private minIntervalMs = 300,
    private concurrency = 1
  ) { }

  private async acquireLock() {
    if (!this.lockFilePath) return
    // 如果锁文件存在且创建时间过久（比如 >5分钟），认为是陈旧锁，直接删除
    if (fs.existsSync(this.lockFilePath)) {
      const stats = fs.statSync(this.lockFilePath)
      const age = Date.now() - stats.ctimeMs
      if (age > 30 * 1000) { // 30秒
        try {
          fs.unlinkSync(this.lockFilePath)
          console.warn('[限流] 删除陈旧锁文件:', this.lockFilePath)
        } catch (err) {
          console.error('[限流] 删除陈旧锁失败:', err)
        }
      }
    }
    while (true) {
      try {
        fs.writeFileSync(this.lockFilePath, process.pid.toString(), { flag: 'wx' })
        return
      } catch (err) {
        const e = err as NodeError
        if (e.code === 'EEXIST') await new Promise(res => setTimeout(res, 100))
        else throw err
      }
    }
  }

  private releaseLock() {
    if (!this.lockFilePath) return
    try { if (fs.existsSync(this.lockFilePath)) fs.unlinkSync(this.lockFilePath) }
    catch (err) { console.error('释放锁失败', err) }
  }

  /**
   * 入队。同一 key 的在途/排队请求共享同一个 Promise(请求级去重);
   * 队列按 concurrency 个并发槽消费,受每分钟上限与最小间隔约束。
   */
  public enqueue<T>(key: string, requestFunc: () => Promise<T>): Promise<T> {
    const existing = this.pending.get(key)
    if (existing) return existing as Promise<T>

    const promise = new Promise<T>((resolve, reject) => {
      this.queue.push({
        key,
        requestFunc: requestFunc as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject
      })
    }).finally(() => this.pending.delete(key))

    this.pending.set(key, promise)
    this.pump()
    return promise
  }

  /** 启动空闲的并发槽;槽位不足或队列为空时直接返回 */
  private pump() {
    while (this.queue.length > 0 && this.activeCount < this.concurrency) {
      this.activeCount++
      void this.processOne().finally(() => {
        this.activeCount--
        this.pump()
      })
    }
  }

  private async processOne() {
    try {
      await this.acquireLock()

      // 每分钟窗口上限
      const now = Date.now()
      const elapsed = now - this.windowStart
      if (elapsed > 60_000) { this.requestCount = 0; this.windowStart = now }
      if (this.requestCount >= this.maxRequestsPerMinute) {
        const waitTime = 60_000 - elapsed + 100
        await new Promise(res => setTimeout(res, waitTime))
        this.requestCount = 0
        this.windowStart = Date.now()
      }

      // 相邻请求最小间隔(按发起时间计,保证并发下也有节奏)
      const waitMs = Math.max(
        0,
        this.minIntervalMs - (Date.now() - this.lastRequestTime)
      )
      if (waitMs > 0) await new Promise(res => setTimeout(res, waitMs))

      const item = this.queue.shift()
      if (!item) return

      this.lastRequestTime = Date.now()
      try {
        const result: unknown = await item.requestFunc()
        this.requestCount++
        item.resolve(result)
      } catch (err) {
        item.reject(err)
      }
    } catch (err) {
      console.error('限流队列异常', err)
    } finally {
      this.releaseLock()
    }
  }
}
