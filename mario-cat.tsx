"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'

const GRAVITY = 0.5
const JUMP_STRENGTH = 15
const MOVE_SPEED = 7
const CAT_WIDTH = 118
const CAT_HEIGHT = 118
const SUNFLOWER_SIZE = 45
const SCORE_BG_WIDTH = 256
const SCORE_BG_HEIGHT = 128
const BLOCK_NAME_HEIGHT = 60  // 添加块名称显示区域高度

// 移除网格系统，使用精确像素值
const BLOCKS = [
  // 块1 - 默认起点（左下方）
  { 
    x: 192,
    y: 576,
    type: '块1-默认起点',
    width: 192,
    height: 64
  },

  // 块2 - 启动（中上方）
  { 
    x: 386,
    y: 448,
    type: '块2-启动',
    width: 192,
    height: 64
  },

  // 块3 - 深度工作（顶部中间）
  { 
    x: 576,
    y: 320,
    type: '块3-深度工作',
    width: 384,
    height: 64
  },

  // 块4 - 午间空地（右上方）
  { 
    x: 960,
    y: 448,
    type: '块4-午间空地',
    width: 192,
    height: 64
  },

  // 块5 - 漫游玩耍（中下方）
  { 
    x: 646,
    y: 640,
    type: '块5-漫游玩耍',
    width: 384,
    height: 64
  },

  // 块6 - 关机（底部中间）
  { 
    x: 451,
    y: 768,
    type: '块6-关机',
    width: 192,
    height: 64
  },

  // 块7 - 浅度工作（右下方）
  { 
    x: 1088,
    y: 576,
    type: '块7-浅度工作',
    width: 255,
    height: 64
  }
]

// 按照块的顺序重新排列向日葵位置
const SUNFLOWER_POSITIONS = [
  // 块1 - 默认起点区域
  { x: 192, y: 512 },  // 块1上方
  { x: 256, y: 480 },  // 块1上方额外，向右偏移
  
  // 块2 - 启动区域
  { x: 386, y: 384 },  // 块2上方
  { x: 450, y: 352 },  // 块2上方额外，向右偏移
  
  // 块3 - 深度工作区域
  { x: 576, y: 256 },  // 块3上方
  { x: 640, y: 224 },  // 块3上方额外，向右偏移
  { x: 768, y: 256 },  // 块3上方（因为块3较宽）
  { x: 832, y: 224 },  // 块3上方额外，向右偏移
  
  // 块4 - 午间空地区域
  { x: 960, y: 384 },  // 块4上方
  { x: 1024, y: 352 },  // 块4上方额外，向右偏移
  
  // 块5 - 漫游玩耍区域
  { x: 646, y: 576 },  // 块5上方
  { x: 710, y: 544 },  // 块5上方额外，向右偏移
  { x: 838, y: 576 },  // 块5上方（因为块5较宽）
  { x: 902, y: 544 },  // 块5上方额外，向右偏移
  
  // 块6 - 关机区域
  { x: 451, y: 704 },  // 块6上方
  { x: 515, y: 672 },  // 块6上方额外，向右偏移
  
  // 块7 - 浅度工作区域
  { x: 1088, y: 512 },  // 块7上方
  { x: 1152, y: 480 },  // 块7上方额外，向右偏移
  { x: 1216, y: 512 },  // 块7上方额外（因为块7较宽）
  { x: 1280, y: 480 }   // 块7上方额外，向右偏移
]

interface Cat {
  x: number
  y: number
  velocityY: number
  velocityX: number
  velocityYManual: number
  isJumping: boolean
  direction: 'left' | 'right'
  isMoving: boolean
}

interface Sunflower {
  x: number
  y: number
  collected: boolean
}

interface Block {
  x: number
  y: number
  type: string
  width: number
  height: number
  image: HTMLImageElement | null
}

export default function MarioCat() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cat, setCat] = useState<Cat>({
    x: 192,  // 与块1的x坐标相同
    y: 448,  // 调整y坐标，使黑猫位置更高
    velocityY: 0,
    velocityX: 0,
    velocityYManual: 0,
    isJumping: false,
    direction: 'right',
    isMoving: false
  })
  const [sunflowers, setSunflowers] = useState<Sunflower[]>([])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [currentBlock, setCurrentBlock] = useState<string>('')  // 添加当前块名称状态

  // 加载游戏资源
  const catImage = useRef<HTMLImageElement | null>(null)
  const backgroundImage = useRef<HTMLImageElement | null>(null)
  const sunflowerImage = useRef<HTMLImageElement | null>(null)
  const blockImages = useRef<Record<string, HTMLImageElement>>({})
  const scoreBgImage = useRef<HTMLImageElement | null>(null)  // 新增：计分背景图片
  const [assetsLoaded, setAssetsLoaded] = useState(false)

  // 重置游戏状态
  const resetGame = useCallback(() => {
    setScore(0)
    setSunflowers(prev => prev.map(sunflower => ({ ...sunflower, collected: false })))
    setCat({
      x: 192,
      y: 448,
      velocityY: 0,
      velocityX: 0,
      velocityYManual: 0,
      isJumping: false,
      direction: 'right',
      isMoving: false
    })
  }, [])

  useEffect(() => {
    const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })

    Promise.all([
      loadImage('/game-assets/black-cat.png'),
      loadImage('/game-assets/background.png'),
      loadImage('/game-assets/sunflower.png'),
      loadImage('/game-assets/向日葵计数.png'),
      ...BLOCKS.map(block => loadImage(`/game-assets/${block.type}.png`))
    ]).then(([cat, background, sunflower, scoreBg, ...blockImgs]) => {
      catImage.current = cat
      backgroundImage.current = background
      sunflowerImage.current = sunflower
      scoreBgImage.current = scoreBg
      
      // 存储方块图片
      BLOCKS.forEach((block, index) => {
        blockImages.current[block.type] = blockImgs[index]
      })

      // 初始化方块
      setBlocks(BLOCKS.map(block => ({
        ...block,
        image: blockImgs[BLOCKS.findIndex(b => b.type === block.type)]
      })))

      setAssetsLoaded(true)
    })
  }, [])

  // 生成向日葵
  useEffect(() => {
    if (!assetsLoaded) return

    const generateSunflowers = () => {
      const newSunflowers = SUNFLOWER_POSITIONS.map(pos => ({
        x: pos.x,
        y: pos.y,
        collected: false
      }))
      setSunflowers(newSunflowers)
    }

    generateSunflowers()
    resetGame()
  }, [assetsLoaded, resetGame])

  // 检查碰撞
  const checkCollision = useCallback((x: number, y: number, width: number, height: number) => {
    return blocks.find(block => {
      return (
        x < block.x + block.width &&
        x + width > block.x &&
        y < block.y + block.height &&
        y + height > block.y
      )
    })
  }, [blocks])

  // 添加新的 useEffect 来处理块变化
  useEffect(() => {
    const handleBlockChange = (block: Block | undefined) => {
      if (block) {
        const blockName = block.type.replace('块', '空间').replace('-', '：')
        setCurrentBlock(blockName)
        // 发送自定义事件
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('blockChange', { detail: blockName }))
        }
      }
    }

    // 检查当前碰撞的块
    const blockCollision = checkCollision(cat.x, cat.y, CAT_WIDTH, CAT_HEIGHT)
    handleBlockChange(blockCollision)
  }, [cat.x, cat.y, checkCollision])

  // 处理键盘输入
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return

      switch (e.code) {
        case 'ArrowLeft':
          setCat(prev => ({ ...prev, velocityX: -MOVE_SPEED, direction: 'left' }))
          break
        case 'ArrowRight':
          setCat(prev => ({ ...prev, velocityX: MOVE_SPEED, direction: 'right' }))
          break
        case 'ArrowUp':
          setCat(prev => ({ ...prev, velocityYManual: -MOVE_SPEED }))
          break
        case 'ArrowDown':
          setCat(prev => ({ ...prev, velocityYManual: MOVE_SPEED }))
          break
        case 'Space':
          if (!cat.isJumping) {
            setCat(prev => ({ ...prev, velocityY: -JUMP_STRENGTH, isJumping: true }))
          }
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'ArrowRight':
          setCat(prev => ({ ...prev, velocityX: 0 }))
          break
        case 'ArrowUp':
        case 'ArrowDown':
          setCat(prev => ({ ...prev, velocityYManual: 0 }))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [cat.isJumping, gameOver])

  // 游戏主循环
  useEffect(() => {
    if (!assetsLoaded) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const gameLoop = setInterval(() => {
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 绘制背景
      if (backgroundImage.current) {
        ctx.drawImage(backgroundImage.current, 0, 0, canvas.width, canvas.height)
      }

      // 绘制方块
      blocks.forEach(block => {
        if (block.image) {
          ctx.drawImage(block.image, block.x, block.y, block.width, block.height)
        }
      })

      // 更新猫咪位置
      setCat(prev => {
        const newY = prev.y + prev.velocityY + prev.velocityYManual
        const newX = prev.x + prev.velocityX

        // 重力效果
        const newVelocityY = prev.velocityY + GRAVITY

        // 检查与方块的碰撞
        const blockCollision = checkCollision(newX, newY, CAT_WIDTH, CAT_HEIGHT)
        
        // 如果碰到方块顶部
        if (blockCollision && prev.velocityY >= 0) {
          const blockTop = blockCollision.y
          if (prev.y + CAT_HEIGHT <= blockTop + 10) {
            return {
              ...prev,
              y: blockTop - CAT_HEIGHT,
              velocityY: 0,
              isJumping: false
            }
          }
        }

        // 地面碰撞检测
        if (newY > canvas.height - CAT_HEIGHT) {
          return {
            ...prev,
            y: canvas.height - CAT_HEIGHT,
            velocityY: 0,
            isJumping: false
          }
        }

        // 天花板碰撞检测
        if (newY < 0) {
          return {
            ...prev,
            y: 0,
            velocityY: 0,
            velocityYManual: 0
          }
        }

        // 边界检测
        const boundedX = Math.max(0, Math.min(canvas.width - CAT_WIDTH, newX))

        return {
          ...prev,
          x: boundedX,
          y: newY,
          velocityY: newVelocityY
        }
      })

      // 检测向日葵收集
      setSunflowers(prev => {
        return prev.map(sunflower => {
          if (sunflower.collected) return sunflower

          const distance = Math.sqrt(
            Math.pow(cat.x + CAT_WIDTH/2 - (sunflower.x + SUNFLOWER_SIZE/2), 2) +
            Math.pow(cat.y + CAT_HEIGHT/2 - (sunflower.y + SUNFLOWER_SIZE/2), 2)
          )

          if (distance < (CAT_WIDTH + SUNFLOWER_SIZE) / 2) {
            setScore(s => s + 1)
            return { ...sunflower, collected: true }
          }
          return sunflower
        })
      })

      // 绘制猫咪
      if (catImage.current) {
        ctx.save()
        if (cat.direction === 'left') {
          ctx.scale(-1, 1)
          ctx.drawImage(
            catImage.current,
            -cat.x - CAT_WIDTH,
            cat.y,
            CAT_WIDTH,
            CAT_HEIGHT
          )
        } else {
          ctx.drawImage(
            catImage.current,
            cat.x,
            cat.y,
            CAT_WIDTH,
            CAT_HEIGHT
          )
        }
        ctx.restore()
      }

      // 绘制向日葵
      sunflowers.forEach(sunflower => {
        if (!sunflower.collected && sunflowerImage.current) {
          ctx.drawImage(
            sunflowerImage.current,
            sunflower.x,
            sunflower.y,
            SUNFLOWER_SIZE,
            SUNFLOWER_SIZE
          )
        }
      })
    }, 1000 / 60)

    return () => clearInterval(gameLoop)
  }, [assetsLoaded, cat, sunflowers, score, gameOver, blocks, checkCollision])

  return (
    <div className="relative">
      {/* 向日葵计数 */}
      <div className="fixed top-16 left-8 z-50">
        {scoreBgImage.current && (
          <div className="relative" style={{ width: SCORE_BG_WIDTH, height: SCORE_BG_HEIGHT }}>
            <img
              src={scoreBgImage.current.src}
              alt="score background"
              width={SCORE_BG_WIDTH}
              height={SCORE_BG_HEIGHT}
              className="absolute inset-0"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-4">
              {sunflowerImage.current && (
                <img
                  src={sunflowerImage.current.src}
                  alt="sunflower"
                  width={45}
                  height={45}
                />
              )}
              <span className="text-[#602719] text-4xl font-bold">{score}</span>
            </div>
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={1340}    // 设置为精确的宽度
        height={952}    // 设置为精确的高度
        className="border border-gray-300"
      />
    </div>
  )
} 