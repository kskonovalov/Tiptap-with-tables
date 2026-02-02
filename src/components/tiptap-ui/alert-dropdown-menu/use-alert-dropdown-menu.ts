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
 * Configuration for the alert dropdown menu functionality
 */
export interface UseAlertDropdownMenuConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Available alert types
   * @default ["primary", "secondary", "info", "success", "warning", "error"]
   */
  types?: AlertType[]
  /**
   * Whether the dropdown should hide when alert is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
}

/**
 * Checks if any alert type can be toggled in the current editor state
 */
export function canToggleAlert(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("alert", editor)) return false

  return editor.can().toggleAlert()
}

/**
 * Toggles alert with specified type
 */
export function toggleAlert(
  editor: Editor | null,
  type: AlertType
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
 * Determines if the alert dropdown menu should be shown
 */
export function shouldShowAlertDropdown(props: {
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
 * Custom hook that provides alert dropdown menu functionality for Tiptap editor
 */
export function useAlertDropdownMenu(config?: UseAlertDropdownMenuConfig) {
  const {
    editor: providedEditor,
    types = ["primary", "secondary", "info", "success", "warning", "error"],
    hideWhenUnavailable = false,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canToggle = canToggleAlert(editor)
  const isActive = editor?.isActive("alert") || false
  const currentType = (editor?.getAttributes("alert")?.type as AlertType) || "info"

  useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(
        shouldShowAlertDropdown({ editor, hideWhenUnavailable })
      )
    }

    handleSelectionUpdate()

    editor.on("selectionUpdate", handleSelectionUpdate)

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable])

  const handleToggle = useCallback(
    (type: AlertType) => {
      if (!editor) return false
      return toggleAlert(editor, type)
    },
    [editor]
  )

  return {
    isVisible,
    isActive,
    currentType,
    canToggle,
    types,
    handleToggle,
    label: "Предупреждение",
    Icon: AlertIcon,
  }
}
