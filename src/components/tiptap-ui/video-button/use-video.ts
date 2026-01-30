"use client"

import { useCallback, useEffect, useState } from "react"
import { type Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Lib ---
import { isNodeInSchema } from "@/lib/tiptap-utils"

// --- Icons ---
import { ImagePlusIcon } from "@/components/tiptap-icons/image-plus-icon"

/**
 * Configuration for the video functionality
 */
export interface UseVideoConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether the button should hide when insertion is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful video insertion.
   */
  onInserted?: () => void
}

/**
 * Checks if video can be inserted in the current editor state
 */
export function canInsertVideo(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("video", editor)) return false

  return editor.can().insertContent({ type: "video" })
}

/**
 * Inserts a video node in the editor
 */
export function insertVideo(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!canInsertVideo(editor)) return false

  try {
    return editor.chain().focus().setVideo().run()
  } catch {
    return false
  }
}

/**
 * Determines if the video button should be shown
 */
export function shouldShowButton(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("video", editor)) return false

  if (hideWhenUnavailable && !editor.isActive("code")) {
    return canInsertVideo(editor)
  }

  return true
}

/**
 * Custom hook that provides video functionality for Tiptap editor
 */
export function useVideo(config?: UseVideoConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onInserted,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canInsert = canInsertVideo(editor)

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

  const handleVideo = useCallback(() => {
    if (!editor) return false

    const success = insertVideo(editor)
    if (success) {
      onInserted?.()
    }
    return success
  }, [editor, onInserted])

  return {
    isVisible,
    handleVideo,
    canInsert,
    label: "Добавить видео",
    Icon: ImagePlusIcon,
  }
}
