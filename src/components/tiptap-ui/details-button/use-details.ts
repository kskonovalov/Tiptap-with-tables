"use client"

import { useCallback, useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon"

// --- UI Utils ---
import { isNodeInSchema } from "@/lib/tiptap-utils"

/**
 * Configuration for the details functionality
 */
export interface UseDetailsConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether the button should hide when details is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful toggle.
   */
  onToggled?: () => void
}

/**
 * Checks if details can be set in the current editor state
 */
export function canSetDetails(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("details", editor)) return false

  return editor.can().setDetails()
}

/**
 * Sets details node
 */
export function setDetails(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!canSetDetails(editor)) return false

  try {
    return editor.chain().focus().setDetails().run()
  } catch {
    return false
  }
}

/**
 * Determines if the details button should be shown
 */
export function shouldShowButton(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("details", editor)) return false

  if (hideWhenUnavailable) {
    return canSetDetails(editor)
  }

  return true
}

/**
 * Custom hook that provides details functionality for Tiptap editor
 */
export function useDetails(config?: UseDetailsConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onToggled,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canSet = canSetDetails(editor)
  const isActive = editor?.isActive("details") || false

  useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(shouldShowButton({ editor, hideWhenUnavailable }))
    }

    handleSelectionUpdate()

    editor.on("selectionUpdate", handleSelectionUpdate)

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable])

  const handleSet = useCallback(() => {
    if (!editor) return false

    const success = setDetails(editor)
    if (success) {
      onToggled?.()
    }
    return success
  }, [editor, onToggled])

  return {
    isVisible,
    isActive,
    handleSet,
    canSet,
    label: "Детали",
    Icon: ChevronDownIcon,
  }
}
