"use client"

import { forwardRef, useCallback } from "react"
import type { Editor } from "@tiptap/react"

import { useTiptapEditor } from "../../../hooks/use-tiptap-editor"
import { useFormatPainter } from "./use-format-painter"
import type { ButtonProps } from "../../tiptap-ui-primitive/button/index"
import { Button } from "../../tiptap-ui-primitive/button/index"
import { ApplyFormatIcon } from "../../tiptap-icons/apply-format-icon"

export interface ApplyFormatButtonProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null
}

export const ApplyFormatButton = forwardRef<HTMLButtonElement, ApplyFormatButtonProps>(
  ({ editor: providedEditor, onClick, ...buttonProps }, ref) => {
    const { editor } = useTiptapEditor(providedEditor)
    const { applyFormat, hasCopiedFormat, canApply } = useFormatPainter({ editor })

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        applyFormat()
      },
      [onClick, applyFormat]
    )

    if (!hasCopiedFormat) return null

    return (
      <Button
        type="button"
        disabled={!canApply}
        data-style="ghost"
        data-active-state="off"
        data-disabled={!canApply}
        role="button"
        tabIndex={-1}
        aria-label="Применить форматирование"
        tooltip="Применить форматирование"
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        <ApplyFormatIcon className="tiptap-button-icon" />
      </Button>
    )
  }
)

ApplyFormatButton.displayName = "ApplyFormatButton"
