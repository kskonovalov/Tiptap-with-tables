import { useCallback, useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"
import { NodeSelection } from "@tiptap/pm/state"

// --- Hooks ---
import { useTiptapEditor } from "../../../hooks/use-tiptap-editor"

// --- Icons ---
import { AlignCenterIcon } from "../../tiptap-icons/align-center-icon"
import { AlignJustifyIcon } from "../../tiptap-icons/align-justify-icon"
import { AlignLeftIcon } from "../../tiptap-icons/align-left-icon"
import { AlignRightIcon } from "../../tiptap-icons/align-right-icon"

export type ImageAlign = "left" | "center" | "right" | "justify"

export interface UseImageAlignConfig {
  editor?: Editor | null
  align: ImageAlign
  extensionName?: string
  attributeName?: string
  hideWhenUnavailable?: boolean
  onAligned?: () => void
}

export const imageAlignIcons = {
  left: AlignLeftIcon,
  center: AlignCenterIcon,
  right: AlignRightIcon,
  justify: AlignJustifyIcon,
}

export const imageAlignLabels: Record<ImageAlign, string> = {
  left: "Выровнять по левому краю",
  center: "Выровнять по центру",
  right: "Выровнять по правому краю",
  justify: "Растянуть на всю ширину",
}

function getSelectedImageNode(editor: Editor | null, extensionName: string) {
  if (!editor) return null
  const { selection } = editor.state
  if (
    selection instanceof NodeSelection &&
    selection.node.type.name === extensionName
  ) {
    return selection.node
  }
  return null
}

export function canSetImageAlign(
  editor: Editor | null,
  extensionName: string,
): boolean {
  if (!editor || !editor.isEditable) return false
  return getSelectedImageNode(editor, extensionName) !== null
}

export function isImageAlignActive(
  editor: Editor | null,
  align: ImageAlign,
  extensionName: string,
  attributeName: string,
): boolean {
  if (!editor) return false
  const node = getSelectedImageNode(editor, extensionName)
  if (!node) return false
  return node.attrs[attributeName] === align
}

export function setImageAlign(
  editor: Editor | null,
  align: ImageAlign,
  extensionName: string,
  attributeName: string,
): boolean {
  if (!editor || !editor.isEditable) return false
  const node = getSelectedImageNode(editor, extensionName)
  if (!node) return false

  const currentAlign = node.attrs[attributeName]
  const newAlign = currentAlign === align ? null : align

  const { from } = editor.state.selection
  const success = editor
    .chain()
    .focus()
    .updateAttributes(extensionName, { [attributeName]: newAlign })
    .run()

  if (success) {
    // Sync to DOM — the ResizableNodeView doesn't auto-update attributes
    const dom = editor.view.nodeDOM(from) as HTMLElement | null
    const img = dom?.querySelector('img') ?? null
    if (img) {
      if (newAlign) {
        img.dataset.align = newAlign
      } else {
        delete img.dataset.align
      }
    }
  }

  return success
}

export function useImageAlign(config: UseImageAlignConfig) {
  const {
    editor: providedEditor,
    align,
    extensionName = "image",
    attributeName = "data-align",
    hideWhenUnavailable = false,
    onAligned,
  } = config

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)

  const canAlign = canSetImageAlign(editor, extensionName)
  const isActive = isImageAlignActive(editor, align, extensionName, attributeName)

  useEffect(() => {
    if (!editor) return

    const handleUpdate = () => {
      const canDo = canSetImageAlign(editor, extensionName)
      setIsVisible(hideWhenUnavailable ? canDo : true)
    }

    handleUpdate()

    editor.on("selectionUpdate", handleUpdate)
    editor.on("transaction", handleUpdate)

    return () => {
      editor.off("selectionUpdate", handleUpdate)
      editor.off("transaction", handleUpdate)
    }
  }, [editor, hideWhenUnavailable, extensionName])

  const handleImageAlign = useCallback(() => {
    if (!editor) return false

    const success = setImageAlign(editor, align, extensionName, attributeName)
    if (success) {
      onAligned?.()
    }
    return success
  }, [editor, align, extensionName, attributeName, onAligned])

  return {
    isVisible,
    isActive,
    handleImageAlign,
    canAlign,
    label: imageAlignLabels[align],
    Icon: imageAlignIcons[align],
  }
}
