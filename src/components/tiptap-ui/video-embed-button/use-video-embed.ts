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
 * Configuration for the video embed functionality
 */
export interface UseVideoEmbedConfig {
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
   * Callback function called after a successful video embed insertion.
   */
  onInserted?: () => void
}

/**
 * Checks if video embed can be inserted in the current editor state
 */
export function canInsertVideoEmbed(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("videoEmbed", editor)) return false

  return editor.can().insertContent({ type: "videoEmbed" })
}

/**
 * Inserts a video embed node in the editor
 */
export function insertVideoEmbed(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!canInsertVideoEmbed(editor)) return false

  try {
    return editor.chain().focus().setVideoEmbed().run()
  } catch {
    return false
  }
}

/**
 * Determines if the video embed button should be shown
 */
export function shouldShowButton(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("videoEmbed", editor)) return false

  if (hideWhenUnavailable && !editor.isActive("code")) {
    return canInsertVideoEmbed(editor)
  }

  return true
}

/**
 * Custom hook that provides video embed functionality for Tiptap editor
 */
export function useVideoEmbed(config?: UseVideoEmbedConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onInserted,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canInsert = canInsertVideoEmbed(editor)

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

  const handleVideoEmbed = useCallback(() => {
    if (!editor) return false

    const success = insertVideoEmbed(editor)
    if (success) {
      onInserted?.()
    }
    return success
  }, [editor, onInserted])

  return {
    isVisible,
    handleVideoEmbed,
    canInsert,
    label: "Добавить видео",
    Icon: ImagePlusIcon,
  }
}
