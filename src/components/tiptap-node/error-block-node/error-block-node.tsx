"use client"

import type { NodeViewProps } from "@tiptap/react"
import { NodeViewWrapper } from "@tiptap/react"
import { Button } from "../../tiptap-ui-primitive/button/index"
import { ERROR_MESSAGES } from "../../../lib/error-messages"

export function ErrorBlockNodeView({ node, editor, getPos }: NodeViewProps) {
  const handleRemove = () => {
    const pos = getPos()
    if (pos === undefined) return
    editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run()
  }

  if (!editor.isEditable) {
    return null
  }

  return (
    <NodeViewWrapper
      data-error-block="true"
      contentEditable={false}
    >
      <span>{ERROR_MESSAGES.PREFIX}{node.attrs.message || ERROR_MESSAGES.UNKNOWN}</span>
      <Button onClick={handleRemove}>Удалить блок</Button>
    </NodeViewWrapper>
  )
}
