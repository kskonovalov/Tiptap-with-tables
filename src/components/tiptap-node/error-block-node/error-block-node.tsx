"use client"

import type { NodeViewProps } from "@tiptap/react"
import { NodeViewWrapper } from "@tiptap/react"
import { ERROR_MESSAGES } from "../../../lib/error-messages"

export function ErrorBlockNodeView({ node, editor }: NodeViewProps) {
  if (!editor.isEditable) {
    return null
  }

  return (
    <NodeViewWrapper
      data-error-block="true"
      contentEditable={false}
    >
      {node.attrs.message || ERROR_MESSAGES.UNKNOWN}
    </NodeViewWrapper>
  )
}
