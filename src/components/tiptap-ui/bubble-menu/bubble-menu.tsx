"use client"

import { BubbleMenu as TiptapBubbleMenu } from '@tiptap/react/menus'
import type { Editor } from "@tiptap/react"
import { CellSelection } from "@tiptap/pm/tables"

// --- Hooks ---
import { useTiptapEditor } from "../../../hooks/use-tiptap-editor"

// --- Tiptap UI ---
import { MarkButton } from "../mark-button"
import { LinkPopover } from "../link-popover"
import { CellBackgroundColorButton } from "./cell-background-color-button"
import { ClearFormattingButton } from "./clear-formatting-button"
import { FormatPainterButton, ApplyFormatButton } from "../format-painter/index"

// --- UI Primitives ---
import { Separator } from "../../tiptap-ui-primitive/separator/index"

// --- Styles ---
import "./bubble-menu.scss"

export interface BubbleMenuProps {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
}

/**
 * Bubble menu component that appears when text is selected or table cells are selected
 */
export function BubbleMenu({ editor: providedEditor }: BubbleMenuProps) {
  const { editor } = useTiptapEditor(providedEditor)

  if (!editor) {
    return null
  }

  const isCellSelection = editor.state.selection instanceof CellSelection

  return (
    <TiptapBubbleMenu
      editor={editor}
      shouldShow={({ editor }) => {
        const { selection } = editor.state
        if (selection instanceof CellSelection) return true
        return !selection.empty
      }}
      options={{
        placement: "top",
      }}
      className="bubble-menu"
    >
      <div className="bubble-menu-content">
        <MarkButton editor={editor} type="bold" />
        <MarkButton editor={editor} type="italic" />
        <MarkButton editor={editor} type="underline" />
        <MarkButton editor={editor} type="strike" />
        <MarkButton editor={editor} type="code" />
        <LinkPopover editor={editor} />
        <Separator />
        <ClearFormattingButton editor={editor} />
        <FormatPainterButton editor={editor} />
        <ApplyFormatButton editor={editor} />
        {isCellSelection && (
          <>
            <Separator />
            <CellBackgroundColorButton editor={editor} />
          </>
        )}
      </div>
    </TiptapBubbleMenu>
  )
}
