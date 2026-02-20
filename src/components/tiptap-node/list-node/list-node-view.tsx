import {
  NodeViewContent,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react"
import { useCallback, useEffect, useRef, useState } from "react"

import type { OrderedListStyleType } from "../ordered-list-node/ordered-list-node-extension"
import type { BulletListStyleType } from "../bullet-list-node/bullet-list-node-extension"

const ORDERED_STYLES: { value: OrderedListStyleType; label: string }[] = [
  { value: "decimal", label: "1" },
  { value: "upper-alpha", label: "A" },
  { value: "lower-alpha", label: "a" },
  { value: "upper-roman", label: "I" },
  { value: "lower-roman", label: "i" },
]

const BULLET_STYLES: { value: BulletListStyleType; label: string }[] = [
  { value: "disc", label: "•" },
  { value: "check", label: "✓" },
  { value: "plus", label: "+" },
]

export const ListNodeViewComponent: React.FC<NodeViewProps> = ({
  editor,
  getPos,
  node,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [startInputValue, setStartInputValue] = useState("1")

  const isOrderedList = node.type.name === "orderedList"

  const currentOrderedStyle: OrderedListStyleType =
    (node.attrs.listStyleType as OrderedListStyleType) ?? "decimal"
  const currentOrderedStart: number = (node.attrs.start as number) ?? 1
  const currentBulletStyle: BulletListStyleType =
    (node.attrs.listStyleType as BulletListStyleType) ?? "disc"

  // Keep start input in sync with the node attr
  useEffect(() => {
    if (isOrderedList) {
      setStartInputValue(String(currentOrderedStart))
    }
  }, [isOrderedList, currentOrderedStart])

  // Track whether cursor is inside this specific list instance
  useEffect(() => {
    const checkActive = () => {
      const pos = getPos()
      if (typeof pos !== "number") {
        setIsActive(false)
        return
      }
      const { from } = editor.state.selection
      setIsActive(from >= pos && from < pos + node.nodeSize)
    }

    checkActive()
    editor.on("selectionUpdate", checkActive)
    return () => {
      editor.off("selectionUpdate", checkActive)
    }
  }, [editor, getPos, node.nodeSize])

  // Close menu on click outside the wrapper
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [])

  // Close menu on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const setOrderedStyle = useCallback(
    (style: OrderedListStyleType) => {
      editor
        .chain()
        .focus()
        .updateAttributes("orderedList", { listStyleType: style })
        .run()
    },
    [editor]
  )

  const setOrderedStart = useCallback(
    (start: number) => {
      editor.chain().focus().updateAttributes("orderedList", { start }).run()
    },
    [editor]
  )

  const setBulletStyle = useCallback(
    (style: BulletListStyleType) => {
      editor
        .chain()
        .focus()
        .updateAttributes("bulletList", { listStyleType: style })
        .run()
    },
    [editor]
  )

  // Calculate control button / menu position (same formula as table-main-control-button)
  const getControlPos = () => {
    if (!wrapperRef.current) return null
    const listEl = wrapperRef.current.querySelector(
      "ol, ul"
    ) as HTMLElement | null
    if (!listEl) return null
    const rect = listEl.getBoundingClientRect()
    const wrapperRect = wrapperRef.current.getBoundingClientRect()
    return {
      top: rect.top - wrapperRect.top - 28,
      left: rect.left - wrapperRect.left - 28,
    }
  }

  const controlPos = getControlPos()

  // Apply custom attrs to the actual ul/ol element (Tiptap's contentDOMElement)
  useEffect(() => {
    const listEl = wrapperRef.current?.querySelector("ol, ul") as HTMLElement | null
    if (!listEl) return

    if (!isOrderedList) {
      if (currentBulletStyle !== "disc") {
        listEl.setAttribute("data-bullet-style", currentBulletStyle)
      } else {
        listEl.removeAttribute("data-bullet-style")
      }
    } else {
      if (currentOrderedStyle !== "decimal") {
        listEl.style.listStyleType = currentOrderedStyle
      } else {
        listEl.style.removeProperty("list-style-type")
      }
      ;(listEl as HTMLOListElement).start = currentOrderedStart
    }
  }, [isOrderedList, currentBulletStyle, currentOrderedStyle, currentOrderedStart])

  return (
    <NodeViewWrapper ref={wrapperRef} className="list-node-wrapper">
      <NodeViewContent />

      {/* Control button — appears when cursor is inside this list */}
      {isActive && controlPos && (
        <button
          className="list-main-control-button"
          contentEditable={false}
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setMenuOpen((prev) => !prev)
          }}
          style={{
            position: "absolute",
            top: `${controlPos.top}px`,
            left: `${controlPos.left}px`,
          }}
        >
          ⋮
        </button>
      )}

      {/* Settings menu */}
      {isActive && menuOpen && controlPos && (
        <div
          className="list-control-menu"
          contentEditable={false}
          style={{
            position: "absolute",
            top: `${controlPos.top}px`,
            left: `${controlPos.left + 32}px`,
          }}
        >
          {isOrderedList && (
            <>
              <div className="list-control-menu-label">Стиль нумерации</div>
              <div className="list-control-style-buttons">
                {ORDERED_STYLES.map(({ value, label }) => (
                  <button
                    key={value}
                    className={`list-style-option${currentOrderedStyle === value ? " active" : ""}`}
                    onClick={() => setOrderedStyle(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="list-control-menu-label">Начать с</div>
              <input
                type="number"
                min={1}
                value={startInputValue}
                className="list-start-input"
                onChange={(e) => setStartInputValue(e.target.value)}
                onBlur={() => {
                  const n = parseInt(startInputValue, 10)
                  if (!isNaN(n) && n >= 1) {
                    setOrderedStart(n)
                  } else {
                    setStartInputValue(String(currentOrderedStart))
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const n = parseInt(startInputValue, 10)
                    if (!isNaN(n) && n >= 1) {
                      setOrderedStart(n)
                    }
                  }
                  e.stopPropagation()
                }}
              />
            </>
          )}

          {!isOrderedList && (
            <>
              <div className="list-control-menu-label">Стиль маркера</div>
              <div className="list-control-style-buttons">
                {BULLET_STYLES.map(({ value, label }) => (
                  <button
                    key={value}
                    className={`list-style-option${currentBulletStyle === value ? " active" : ""}`}
                    onClick={() => setBulletStyle(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </NodeViewWrapper>
  )
}

export default ListNodeViewComponent
