import { useCallback } from "react"
import type { Editor } from "@tiptap/react"

import { BanIcon } from "../../tiptap-icons/ban-icon"
import { Button } from "../../tiptap-ui-primitive/button/index"

export interface ClearFormattingButtonProps {
  editor?: Editor | null
}

export function ClearFormattingButton({ editor }: ClearFormattingButtonProps) {
  const handleClick = useCallback(() => {
    if (!editor) return
    editor.chain().focus().unsetAllMarks().unsetTextAlign().unsetNodeBackgroundColor().run()
  }, [editor])

  if (!editor) return null

  return (
    <Button
      type="button"
      data-style="ghost"
      data-active-state="off"
      role="button"
      disabled={!editor.isEditable}
      data-disabled={!editor.isEditable}
      aria-label="Очистить форматирование"
      tooltip="Очистить форматирование"
      onClick={handleClick}
    >
      <BanIcon className="tiptap-button-icon" />
    </Button>
  )
}
