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
import { FONT_FAMILY_OPTIONS } from "../../tiptap-node/fontfamily-node/index"

/**
 * Configuration for the font family dropdown menu functionality
 */
export interface UseFontFamilyDropdownMenuConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether the dropdown should hide when font family is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
}

/**
 * Checks if font family can be set in the current editor state
 */
export function canSetFontFamily(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isMarkInSchema("textStyle", editor)) return false

  return editor.can().setFontFamily("Arial, Helvetica, sans-serif")
}

/**
 * Sets text font family
 */
export function setFontFamily(editor: Editor | null, fontFamily: string): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isMarkInSchema("textStyle", editor)) return false

  try {
    if (!fontFamily) {
      return editor.chain().focus().unsetFontFamily().run()
    }
    return editor.chain().focus().setFontFamily(fontFamily).run()
  } catch {
    return false
  }
}

/**
 * Determines if the font family dropdown menu should be shown
 */
export function shouldShowFontFamilyDropdown(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable) return false
  if (!isMarkInSchema("textStyle", editor)) return false

  if (hideWhenUnavailable) {
    return canSetFontFamily(editor)
  }

  return true
}

/**
 * Custom hook that provides font family dropdown menu functionality for Tiptap editor
 */
export function useFontFamilyDropdownMenu(config?: UseFontFamilyDropdownMenuConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canSet = canSetFontFamily(editor)
  const currentFontFamily = (editor?.getAttributes("textStyle")?.fontFamily as string) || ""

  useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(
        shouldShowFontFamilyDropdown({ editor, hideWhenUnavailable })
      )
    }

    handleSelectionUpdate()

    editor.on("selectionUpdate", handleSelectionUpdate)

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable])

  const handleSet = useCallback(
    (fontFamily: string) => {
      if (!editor) return false
      return setFontFamily(editor, fontFamily)
    },
    [editor]
  )

  return {
    isVisible,
    currentFontFamily,
    canSet,
    families: FONT_FAMILY_OPTIONS,
    handleSet,
    label: "Шрифт",
    Icon: TypeIcon,
  }
}
