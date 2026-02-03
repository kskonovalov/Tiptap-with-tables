"use client"

import { BubbleMenu as TiptapBubbleMenu } from '@tiptap/react/menus'
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "../../../hooks/use-tiptap-editor"

// --- Tiptap UI ---
import { MarkButton } from "../mark-button"
import { LinkPopover } from "../link-popover"

// --- Styles ---
import "./bubble-menu.scss"

export interface BubbleMenuProps {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
}

/**
 * Bubble menu component that appears when text is selected
 */
export function BubbleMenu({ editor: providedEditor }: BubbleMenuProps) {
  const { editor } = useTiptapEditor(providedEditor)

  if (!editor) {
    return null
  }

  return (
    <TiptapBubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
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
      </div>
    </TiptapBubbleMenu>
  )
}
