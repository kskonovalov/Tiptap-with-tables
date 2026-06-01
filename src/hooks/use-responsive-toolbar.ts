import { useEffect, useMemo, useState, useRef } from "react"
import type { RefObject } from "react"

export interface ToolbarItem {
  element: React.ReactNode
  estimatedWidth: number
}

interface UseResponsiveToolbarConfig {
  items: ToolbarItem[]
  containerRef: RefObject<HTMLElement | null>
  overflowButtonWidth?: number
}

interface UseResponsiveToolbarResult {
  visibleItems: ToolbarItem[]
  hiddenItems: ToolbarItem[]
}

/**
 * Хук для адаптивного toolbar с автоматическим скрытием элементов справа
 */
export function useResponsiveToolbar({
  items,
  containerRef,
  overflowButtonWidth = 50,
}: UseResponsiveToolbarConfig): UseResponsiveToolbarResult {
  const [containerWidth, setContainerWidth] = useState(0)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  // Отслеживаем изменение размера контейнера
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Инициализируем начальную ширину
    setContainerWidth(container.offsetWidth)

    // Создаём ResizeObserver
    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        setContainerWidth(width)
      }
    })

    resizeObserverRef.current.observe(container)

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
    }
  }, [containerRef])

  const { visibleItems, hiddenItems } = useMemo(() => {
    const visible: ToolbarItem[] = []
    const hidden: ToolbarItem[] = []

    if (containerWidth > 0) {
      let currentWidth = 0

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const itemWidth = item.estimatedWidth

        const hasMoreItems = i < items.length - 1
        const needsOverflowSpace = hasMoreItems && (hidden.length > 0 || currentWidth + itemWidth + overflowButtonWidth > containerWidth)

        const requiredSpace = needsOverflowSpace
          ? currentWidth + itemWidth + overflowButtonWidth
          : currentWidth + itemWidth

        if (requiredSpace <= containerWidth) {
          visible.push(item)
          currentWidth += itemWidth
        } else {
          hidden.push(item)
        }
      }
    } else {
      visible.push(...items)
    }

    return { visibleItems: visible, hiddenItems: hidden }
  }, [containerWidth, items, overflowButtonWidth])

  return {
    visibleItems,
    hiddenItems,
  }
}
