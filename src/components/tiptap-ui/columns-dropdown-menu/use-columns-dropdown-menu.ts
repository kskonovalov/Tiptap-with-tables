"use client"

import { useCallback, useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "../../../hooks/use-tiptap-editor"

// --- Icons ---
import { ColumnsIcon } from "../../tiptap-icons/columns-icon"

// --- UI Utils ---
import { isNodeInSchema } from "../../../lib/tiptap-utils"

// --- Types ---
import type { ColumnsCount } from "../../tiptap-node/columns-node/index"

/**
 * Configuration for the columns dropdown menu functionality
 */
export interface UseColumnsDropdownMenuConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether the dropdown should hide when columns is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
}

/**
 * Checks if columns can be set in the current editor state
 */
export function canSetColumns(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("columns", editor)) return false

  return editor.can().setColumns()
}

/**
 * Sets columns with specified count
 */
export function setColumns(
  editor: Editor | null,
  columns: ColumnsCount
): boolean {
  if (!editor || !editor.isEditable) return false
  if (!canSetColumns(editor)) return false

  try {
    return editor.chain().focus().setColumns({ columns }).run()
  } catch {
    return false
  }
}

/**
 * Updates columns count
 */
export function updateColumnsCount(
  editor: Editor | null,
  columns: ColumnsCount
): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("columns", editor)) return false
  if (!editor.isActive("columns")) return false

  try {
    return editor.chain().focus().updateColumnsCount(columns).run()
  } catch {
    return false
  }
}

/**
 * Shifts columns (rotates order)
 */
export function shiftColumns(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("columns", editor)) return false
  if (!editor.isActive("columns")) return false

  try {
    return editor.chain().focus().shiftColumns().run()
  } catch {
    return false
  }
}

/**
 * Determines if the columns dropdown menu should be shown
 */
export function shouldShowColumnsDropdown(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("columns", editor)) return false

  if (hideWhenUnavailable) {
    return canSetColumns(editor)
  }

  return true
}

/**
 * Custom hook that provides columns dropdown menu functionality for Tiptap editor
 */
export function useColumnsDropdownMenu(config?: UseColumnsDropdownMenuConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canSet = canSetColumns(editor)
  const isActive = editor?.isActive("columns") || false
  const currentColumns = (editor?.getAttributes("columns")?.columns as ColumnsCount) || 2

  useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(
        shouldShowColumnsDropdown({ editor, hideWhenUnavailable })
      )
    }

    handleSelectionUpdate()

    editor.on("selectionUpdate", handleSelectionUpdate)

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable])

  const handleSet = useCallback(
    (columns: ColumnsCount) => {
      if (!editor) return false
      
      // Если columns уже активен - обновить количество
      if (editor.isActive("columns")) {
        return updateColumnsCount(editor, columns)
      }
      
      // Иначе создать новый
      return setColumns(editor, columns)
    },
    [editor]
  )

  const handleShift = useCallback(() => {
    if (!editor) return false
    return shiftColumns(editor)
  }, [editor])

  return {
    isVisible,
    isActive,
    currentColumns,
    canSet,
    handleSet,
    handleShift,
    label: "Колонки",
    Icon: ColumnsIcon,
  }
}
