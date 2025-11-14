"use client"
import { useEffect, useState } from "react"

interface SlideControllerProps {
  onSlideChange: (showLanding: boolean) => void
}

export default function SlideController({ onSlideChange }: SlideControllerProps) {
  const [showLanding, setShowLanding] = useState(false)

  useEffect(() => {
    let isScrolling = false
    let scrollTimeout: NodeJS.Timeout

    const handleWheel = (e: WheelEvent) => {
      if (isScrolling) {
        e.preventDefault()
        return
      }

      // 向下滚动 - 显示 Landing Page
      if (e.deltaY > 0 && !showLanding) {
        e.preventDefault()
        isScrolling = true
        setShowLanding(true)
        onSlideChange(true)
        
        setTimeout(() => {
          isScrolling = false
        }, 800) // 动画持续时间
        return
      }

      // 向上滚动 - 隐藏 Landing Page（仅在 Landing Page 顶部时）
      if (e.deltaY < 0 && showLanding) {
        const landingContainer = document.querySelector('.landing-scroll-container')
        if (landingContainer && landingContainer.scrollTop <= 10) {
          e.preventDefault()
          isScrolling = true
          setShowLanding(false)
          onSlideChange(false)
          
          setTimeout(() => {
            isScrolling = false
          }, 800) // 动画持续时间
          return
        }
      }

      // 清除滚动超时
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        isScrolling = false
      }, 150)
    }

    // 移动端触摸事件
    let touchStartY = 0
    let touchStartTime = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY
      touchStartTime = Date.now()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrolling) return

      const touchEndY = e.changedTouches[0].clientY
      const touchDistance = touchStartY - touchEndY
      const touchDuration = Date.now() - touchStartTime
      const velocity = Math.abs(touchDistance) / touchDuration

      // 检查是否为有效的滑动手势
      if (Math.abs(touchDistance) < 50 || velocity < 0.3 || touchDuration > 300) {
        return
      }

      // 向上滑动（显示 Landing Page）
      if (touchDistance > 0 && !showLanding) {
        isScrolling = true
        setShowLanding(true)
        onSlideChange(true)
        
        setTimeout(() => {
          isScrolling = false
        }, 800)
      }
      // 向下滑动（隐藏 Landing Page，仅在 Landing Page 顶部时）
      else if (touchDistance < 0 && showLanding) {
        const landingContainer = document.querySelector('.landing-scroll-container')
        if (landingContainer && landingContainer.scrollTop <= 10) {
          isScrolling = true
          setShowLanding(false)
          onSlideChange(false)
          
          setTimeout(() => {
            isScrolling = false
          }, 800)
        }
      }
    }

    // 添加事件监听器
    window.addEventListener("wheel", handleWheel, { passive: false })
    window.addEventListener("touchstart", handleTouchStart, { passive: true })
    window.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchend", handleTouchEnd)
      clearTimeout(scrollTimeout)
    }
  }, [showLanding, onSlideChange])

  return null
}