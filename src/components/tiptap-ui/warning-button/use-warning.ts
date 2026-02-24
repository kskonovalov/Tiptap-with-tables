"use client"

import { useCallback, useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "../../../hooks/use-tiptap-editor"

// --- Icons ---
import { AlertTriangleIcon } from "../../tiptap-icons/alert-triangle-icon"

// --- UI Utils ---
import { isNodeInSchema } from "../../../lib/tiptap-utils"

/**
 * Configuration for the warning functionality
 */
export interface UseWarningConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether the button should hide when warning is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful insert.
   */
  onInserted?: () => void
}

/**
 * Checks if warning can be inserted in the current editor state
 */
export function canSetWarning(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("warning", editor)) return false

  return editor.can().setWarning()
}

/**
 * Inserts warning node
 */
export function setWarning(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!canSetWarning(editor)) return false

  try {
    return editor.chain().focus().setWarning().run()
  } catch {
    return false
  }
}

/**
 * Determines if the warning button should be shown
 */
export function shouldShowButton(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("warning", editor)) return false

  if (hideWhenUnavailable) {
    return canSetWarning(editor)
  }

  return true
}

/**
 * Custom hook that provides warning functionality for Tiptap editor
 */
export function useWarning(config?: UseWarningConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onInserted,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const isActive = editor?.isActive("warning") || false
  const canSet = isActive || canSetWarning(editor)

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

    let success: boolean
    if (editor.isActive("warning")) {
      try {
        success = editor.chain().focus().unsetWarning().run()
      } catch {
        success = false
      }
    } else {
      success = setWarning(editor)
    }

    if (success) {
      onInserted?.()
    }
    return success
  }, [editor, onInserted])

  return {
    isVisible,
    isActive,
    handleSet,
    canSet,
    label: "Предупреждение",
    Icon: AlertTriangleIcon,
  }
}
