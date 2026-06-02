import { useCallback } from "react"
import type { Editor } from "@tiptap/react"
import { useTiptapEditor } from "../../../hooks/use-tiptap-editor"
import type { CopiedFormat } from "../../tiptap-extension/format-painter/format-painter-extension"

export interface UseFormatPainterConfig {
  editor?: Editor | null
}

export function useFormatPainter({ editor: providedEditor }: UseFormatPainterConfig = {}) {
  const { editor } = useTiptapEditor(providedEditor)

  // Re-renders when a transaction fires (including our empty dispatch from copyFormat).
  // Use cast because editor.storage is typed as the DOM Storage interface in some Tiptap builds.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const copiedFormat: CopiedFormat | null = (editor?.storage as any)?.formatPainter?.copiedFormat ?? null
  const hasCopiedFormat = copiedFormat !== null
  const canCopy = !!editor?.isEditable

  const copyFormat = useCallback(() => {
    editor?.commands.copyFormat()
  }, [editor])

  const applyFormat = useCallback(() => {
    if (!editor || !copiedFormat) return

    const { marks, nodeAttrs } = copiedFormat

    let c = editor.chain().focus()

    // Apply text alignment
    if (nodeAttrs.textAlign) {
      c = c.setTextAlign(nodeAttrs.textAlign as string)
    } else {
      c = c.unsetTextAlign()
    }

    // Apply node background color
    if (nodeAttrs.backgroundColor) {
      c = c.setNodeBackgroundColor(nodeAttrs.backgroundColor as string)
    } else {
      c = c.unsetNodeBackgroundColor()
    }

    // Clear only format-painter-managed marks, preserving link and others
    c = c.unsetMark("bold").unsetMark("italic").unsetMark("underline").unsetMark("strike").unsetMark("textStyle").unsetMark("highlight")

    // Apply inline marks from copied format
    for (const mark of marks) {
      switch (mark.type) {
        case "bold":
          c = c.toggleMark("bold")
          break
        case "italic":
          c = c.toggleMark("italic")
          break
        case "underline":
          c = c.toggleMark("underline")
          break
        case "strike":
          c = c.toggleMark("strike")
          break
        case "textStyle":
          if (mark.attrs.color) c = c.setColor(mark.attrs.color as string)
          if (mark.attrs.fontSize) c = c.setFontSize(mark.attrs.fontSize as string)
          if (mark.attrs.fontFamily) c = c.setFontFamily(mark.attrs.fontFamily as string)
          break
        case "highlight":
          if (mark.attrs.color) c = c.setHighlight({ color: mark.attrs.color as string })
          break
      }
    }

    c.run()
  }, [editor, copiedFormat])

  return {
    copyFormat,
    applyFormat,
    hasCopiedFormat,
    canCopy,
    canApply: hasCopiedFormat && !!editor?.isEditable,
  }
}
