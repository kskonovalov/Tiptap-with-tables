"use client"

import { useCallback, useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "../../../hooks/use-tiptap-editor"

// --- Icons ---
import { PaletteIcon } from "../../tiptap-icons/palette-icon"

// --- UI Utils ---
import { isMarkInSchema } from "../../../lib/tiptap-utils"

// --- Types ---
import { COLOR_OPTIONS, type ColorType } from "../../tiptap-node/color-node/index"

/**
 * Configuration for the color dropdown menu functionality
 */
export interface UseColorDropdownMenuConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether the dropdown should hide when color is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
}

/**
 * Checks if color can be set in the current editor state
 */
export function canSetColor(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isMarkInSchema("textStyle", editor)) return false

  return editor.can().setColor("#000000")
}

/**
 * Sets text color
 */
export function setColor(editor: Editor | null, color: string): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isMarkInSchema("textStyle", editor)) return false

  try {
    if (color === "") {
      // Unset color
      return editor.chain().focus().unsetColor().run()
    }
    return editor.chain().focus().setColor(color).run()
  } catch {
    return false
  }
}

/**
 * Determines if the color dropdown menu should be shown
 */
export function shouldShowColorDropdown(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable) return false
  if (!isMarkInSchema("textStyle", editor)) return false

  if (hideWhenUnavailable) {
    return canSetColor(editor)
  }

  return true
}

/**
 * Custom hook that provides color dropdown menu functionality for Tiptap editor
 */
export function useColorDropdownMenu(config?: UseColorDropdownMenuConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canSet = canSetColor(editor)
  const currentColor = (editor?.getAttributes("textStyle")?.color as string) || ""

  useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(
        shouldShowColorDropdown({ editor, hideWhenUnavailable })
      )
    }

    handleSelectionUpdate()

    editor.on("selectionUpdate", handleSelectionUpdate)

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable])

  const handleSet = useCallback(
    (color: string) => {
      if (!editor) return false
      return setColor(editor, color)
    },
    [editor]
  )

  return {
    isVisible,
    currentColor,
    canSet,
    colors: COLOR_OPTIONS,
    handleSet,
    label: "Цвет текста",
    Icon: PaletteIcon,
  }
}
