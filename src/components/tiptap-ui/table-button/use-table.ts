"use client"

import { useCallback, useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { TableIcon } from "@/components/tiptap-icons/table-icon"

// --- UI Utils ---
import { isNodeInSchema } from "@/lib/tiptap-utils"

/**
 * Configuration for the table functionality
 */
export interface UseTableConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether the button should hide when table is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful table insertion.
   */
  onInserted?: () => void
  /**
   * Number of rows for the table.
   * @default 3
   */
  rows?: number
  /**
   * Number of columns for the table.
   * @default 3
   */
  cols?: number
  /**
   * Whether to include a header row.
   * @default true
   */
  withHeaderRow?: boolean
}

/**
 * Checks if table can be inserted in the current editor state
 */
export function canInsertTable(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("table", editor)) return false

  return editor.can().insertTable({ rows: 3, cols: 3, withHeaderRow: true })
}

/**
 * Inserts a table at the current cursor position
 */
export function insertTable(
  editor: Editor | null,
  options: {
    rows?: number
    cols?: number
    withHeaderRow?: boolean
  } = {}
): boolean {
  if (!editor || !editor.isEditable) return false
  if (!canInsertTable(editor)) return false

  const { rows = 3, cols = 3, withHeaderRow = true } = options

  try {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow }).run()
    return true
  } catch {
    return false
  }
}

/**
 * Determines if the table button should be shown
 */
export function shouldShowButton(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("table", editor)) return false

  if (hideWhenUnavailable) {
    return canInsertTable(editor)
  }

  return true
}

/**
 * Custom hook that provides table functionality for Tiptap editor
 */
export function useTable(config?: UseTableConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onInserted,
    rows = 3,
    cols = 3,
    withHeaderRow = true,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canInsert = canInsertTable(editor)
  const isActive = editor?.isActive("table") || false

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

  const handleInsert = useCallback(() => {
    if (!editor) return false

    const success = insertTable(editor, { rows, cols, withHeaderRow })
    if (success) {
      onInserted?.()
    }
    return success
  }, [editor, onInserted, rows, cols, withHeaderRow])

  return {
    isVisible,
    isActive,
    handleInsert,
    canInsert,
    label: "Вставить таблицу",
    Icon: TableIcon,
  }
}

