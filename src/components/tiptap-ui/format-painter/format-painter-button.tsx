"use client"

import { forwardRef, useCallback } from "react"
import type { Editor } from "@tiptap/react"

import { useTiptapEditor } from "../../../hooks/use-tiptap-editor"
import { useFormatPainter } from "./use-format-painter"
import type { ButtonProps } from "../../tiptap-ui-primitive/button/index"
import { Button } from "../../tiptap-ui-primitive/button/index"
import { FormatPainterIcon } from "../../tiptap-icons/format-painter-icon"

export interface FormatPainterButtonProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null
}

export const FormatPainterButton = forwardRef<HTMLButtonElement, FormatPainterButtonProps>(
  ({ editor: providedEditor, onClick, ...buttonProps }, ref) => {
    const { editor } = useTiptapEditor(providedEditor)
    const { copyFormat, hasCopiedFormat, canCopy } = useFormatPainter({ editor })

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        copyFormat()
      },
      [onClick, copyFormat]
    )

    return (
      <Button
        type="button"
        disabled={!canCopy}
        data-style="ghost"
        data-active-state={hasCopiedFormat ? "on" : "off"}
        data-disabled={!canCopy}
        role="button"
        tabIndex={-1}
        aria-label="Форматировать по образцу"
        aria-pressed={hasCopiedFormat}
        tooltip="Форматировать по образцу"
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        <FormatPainterIcon className="tiptap-button-icon" />
      </Button>
    )
  }
)

FormatPainterButton.displayName = "FormatPainterButton"
