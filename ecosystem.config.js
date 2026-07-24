/**
 * PM2 配置文件 — NotionNext
 *
 * 常用命令：
 *   首次启动:   yarn build && pm2 start ecosystem.config.js
 *   更新重启:   yarn build && pm2 reload ecosystem.config.js
 *   查看状态:   pm2 status
 *   查看日志:   pm2 logs notion-next
 *   开机自启:   pm2 save && pm2 startup
 */
module.exports = {
  apps: [
    {
      name: 'notion-next',
      // 直接用本地 next 二进制启动，等价于 `next start`
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 80',
      cwd: __dirname,
      instances: 1, // 多核机器可改为 'max' 开启集群模式
      exec_mode: 'fork',
      autorestart: true,
      watch: false, // 生产环境不要开 watch，改动后用 pm2 reload
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 80
      },
      // 日志输出到项目 logs 目录
      out_file: 'logs/pm2-out.log',
      error_file: 'logs/pm2-error.log',
      merge_logs: true,
      time: true // 日志带时间戳
    }
  ]
}
