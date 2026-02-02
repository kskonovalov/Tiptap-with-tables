"use client"

import { useCallback, useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { AlertIcon } from "@/components/tiptap-icons/alert-icon"

// --- UI Utils ---
import { isNodeInSchema } from "@/lib/tiptap-utils"

// --- Types ---
import type { AlertType } from "@/components/tiptap-node/alert-node"

/**
 * Configuration for the alert functionality
 */
export interface UseAlertConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether the button should hide when alert is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Default alert type to use when toggling
   * @default "info"
   */
  defaultType?: AlertType
  /**
   * Callback function called after a successful toggle.
   */
  onToggled?: () => void
}

/**
 * Checks if alert can be toggled in the current editor state
 */
export function canToggleAlert(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("alert", editor)) return false

  return editor.can().toggleAlert()
}

/**
 * Toggles alert formatting
 */
export function toggleAlert(
  editor: Editor | null,
  type: AlertType = "info"
): boolean {
  if (!editor || !editor.isEditable) return false
  if (!canToggleAlert(editor)) return false

  try {
    return editor.chain().focus().toggleAlert({ type }).run()
  } catch {
    return false
  }
}

/**
 * Updates alert type
 */
export function updateAlertType(
  editor: Editor | null,
  type: AlertType
): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("alert", editor)) return false
  if (!editor.isActive("alert")) return false

  try {
    return editor.chain().focus().updateAlertType(type).run()
  } catch {
    return false
  }
}

/**
 * Determines if the alert button should be shown
 */
export function shouldShowButton(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("alert", editor)) return false

  if (hideWhenUnavailable) {
    return canToggleAlert(editor)
  }

  return true
}

/**
 * Custom hook that provides alert functionality for Tiptap editor
 */
export function useAlert(config?: UseAlertConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    defaultType = "info",
    onToggled,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canToggle = canToggleAlert(editor)
  const isActive = editor?.isActive("alert") || false
  const currentType = (editor?.getAttributes("alert")?.type as AlertType) || defaultType

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

  const handleToggle = useCallback(
    (type?: AlertType) => {
      if (!editor) return false

      const success = toggleAlert(editor, type || defaultType)
      if (success) {
        onToggled?.()
      }
      return success
    },
    [editor, defaultType, onToggled]
  )

  const handleUpdateType = useCallback(
    (type: AlertType) => {
      if (!editor) return false
      return updateAlertType(editor, type)
    },
    [editor]
  )

  return {
    isVisible,
    isActive,
    currentType,
    handleToggle,
    handleUpdateType,
    canToggle,
    label: "Предупреждение",
    Icon: AlertIcon,
  }
}
