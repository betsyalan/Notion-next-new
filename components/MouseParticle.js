import { useEffect } from 'react'

/**
 * 鼠标跟随粒子特效(仿 DeepSeek 风格)
 * - 鼠标移动时在光标处生成粒子,粒子漂移并逐渐淡出
 * - 距离较近的粒子之间绘制半透明连线(星座网络感)
 * - canvas 完全透明,不改变页面底色和风格
 * - 颜色跟随主题主色,深浅模式自适应
 */
const MouseParticle = () => {
  useEffect(() => {
    // 移动端/触摸设备降级:不启用该特效
    const isTouchDevice =
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(max-width: 600px)').matches
    if (isTouchDevice) {
      return
    }

    // ===== 可调参数 =====
    const MAX_PARTICLES = 150 // 粒子上限,防止高频 mousemove 卡顿
    const SPAWN_PER_MOVE = 2 // 每次鼠标移动生成的粒子数
    const LINK_DISTANCE = 90 // 粒子间连线的最大距离(px)
    const LIFE_DECAY = 0.008 // 每帧透明度衰减量

    // 创建全屏透明画布,置于内容层之上(否则会被卡片白色背景完全遮挡),
    // pointer-events: none 不影响任何交互,半透明小粒子不遮挡阅读
    const canvas = document.createElement('canvas')
    canvas.id = 'mouseParticleCanvas'
    canvas.style.cssText =
      'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;'
    document.body.appendChild(canvas)
    const ctx = canvas.getContext('2d')

    // 按 devicePixelRatio 适配高清屏
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const particles = [] // 存活的粒子列表

    // 鼠标移动时在光标处生成粒子
    const onMouseMove = e => {
      for (let i = 0; i < SPAWN_PER_MOVE; i++) {
        particles.push({
          x: e.clientX,
          y: e.clientY,
          // 随机小初速度,让粒子向四周缓慢漂移
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          size: Math.random() * 2 + 0.8, // 粒子半径 0.8~2.8
          life: 1 // 剩余透明度 1→0
        })
      }
      // 超出上限时移除最老的粒子
      if (particles.length > MAX_PARTICLES) {
        particles.splice(0, particles.length - MAX_PARTICLES)
      }
    }
    window.addEventListener('mousemove', onMouseMove)

    let animationId = null
    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      // 每帧读取深色模式状态,自动切换粒子颜色
      // 浅色模式用主题主色 #3758F9,深色模式用浅蓝白保证可见
      const isDark = document.documentElement.classList.contains('dark')
      const rgb = isDark ? '150, 180, 255' : '55, 88, 249'

      // 更新并绘制粒子
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life -= LIFE_DECAY
        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }
        ctx.fillStyle = `rgba(${rgb}, ${p.life * 0.8})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }

      // 绘制近距离粒子间的连线,透明度随距离线性衰减
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x
          const dy = particles[a].y - particles[b].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < LINK_DISTANCE) {
            // 连线透明度同时受距离和两个粒子剩余生命影响
            const alpha =
              (1 - dist / LINK_DISTANCE) *
              Math.min(particles[a].life, particles[b].life) *
              0.5
            ctx.strokeStyle = `rgba(${rgb}, ${alpha})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particles[a].x, particles[a].y)
            ctx.lineTo(particles[b].x, particles[b].y)
            ctx.stroke()
          }
        }
      }

      animationId = requestAnimationFrame(animate)
    }
    animate()

    // 组件卸载时清理:停止动画、移除监听、移除画布
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', resize)
      canvas.parentNode?.removeChild(canvas)
    }
  }, [])

  // 画布由 useEffect 直接操作 DOM 创建,组件本身不渲染内容
  return null
}

export default MouseParticle
