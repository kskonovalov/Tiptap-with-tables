"use client"

import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "../../../hooks/use-tiptap-editor"

// --- Tiptap UI ---
import { ImageAlignButton } from "../image-align-button/index"

// --- Styles ---
import "../bubble-menu/bubble-menu.scss"

export interface ImageBubbleMenuProps {
  editor?: Editor | null
}

export function ImageBubbleMenu({ editor: providedEditor }: ImageBubbleMenuProps) {
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
      shouldShow={({ editor: ed }) => {
        return ed.isActive("image")
      }}
    >
      <div className="bubble-menu-content">
        <ImageAlignButton editor={editor} align="left" />
        <ImageAlignButton editor={editor} align="center" />
        <ImageAlignButton editor={editor} align="right" />
        <ImageAlignButton editor={editor} align="justify" />
      </div>
    </TiptapBubbleMenu>
  )
}
