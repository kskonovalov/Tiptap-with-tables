"use client"

import type { NodeViewProps } from "@tiptap/react"
import { NodeViewWrapper } from "@tiptap/react"

export function ErrorBlockNodeView({ node, editor }: NodeViewProps) {
  if (!editor.isEditable) {
    return null
  }

  return (
    <NodeViewWrapper
      data-error-block="true"
      contentEditable={false}
    >
      {node.attrs.message || "Unknown error"}
    </NodeViewWrapper>
  )
}
