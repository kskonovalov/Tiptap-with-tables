"use client"

import { useCallback, useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "../../../hooks/use-tiptap-editor"

// --- Icons ---
import { TypeIcon } from "../../tiptap-icons/type-icon"

// --- UI Utils ---
import { isMarkInSchema } from "../../../lib/tiptap-utils"

// --- Types ---
import { FONT_SIZE_OPTIONS, type FontSizeType } from "../../tiptap-node/fontsize-node/index"

/**
 * Configuration for the font size dropdown menu functionality
 */
export interface UseFontSizeDropdownMenuConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether the dropdown should hide when font size is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
}

/**
 * Checks if font size can be set in the current editor state
 */
export function canSetFontSize(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isMarkInSchema("textStyle", editor)) return false

  return editor.can().setFontSize("1em")
}

/**
 * Sets text font size
 */
export function setFontSize(editor: Editor | null, fontSize: string): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isMarkInSchema("textStyle", editor)) return false

  try {
    if (fontSize === "1em" || fontSize === "") {
      // Unset font size (back to default)
      return editor.chain().focus().unsetFontSize().run()
    }
    return editor.chain().focus().setFontSize(fontSize).run()
  } catch {
    return false
  }
}

/**
 * Determines if the font size dropdown menu should be shown
 */
export function shouldShowFontSizeDropdown(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable) return false
  if (!isMarkInSchema("textStyle", editor)) return false

  if (hideWhenUnavailable) {
    return canSetFontSize(editor)
  }

  return true
}

/**
 * Custom hook that provides font size dropdown menu functionality for Tiptap editor
 */
export function useFontSizeDropdownMenu(config?: UseFontSizeDropdownMenuConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canSet = canSetFontSize(editor)
  const currentFontSize = (editor?.getAttributes("textStyle")?.fontSize as string) || ""

  useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(
        shouldShowFontSizeDropdown({ editor, hideWhenUnavailable })
      )
    }

    handleSelectionUpdate()

    editor.on("selectionUpdate", handleSelectionUpdate)

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable])

  const handleSet = useCallback(
    (fontSize: string) => {
      if (!editor) return false
      return setFontSize(editor, fontSize)
    },
    [editor]
  )

  return {
    isVisible,
    currentFontSize,
    canSet,
    sizes: FONT_SIZE_OPTIONS,
    handleSet,
    label: "Размер шрифта",
    Icon: TypeIcon,
  }
}
