import { forwardRef } from "react"
import type { Editor } from "@tiptap/react"

import { useFormatPainter } from "./use-format-painter"
import { FormatPainterControlButton } from "./format-painter-control-button"
import type { ButtonProps } from "../../tiptap-ui-primitive/button/index"
import { ApplyFormatIcon } from "../../tiptap-icons/apply-format-icon"

export interface ApplyFormatButtonProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null
}

export const ApplyFormatButton = forwardRef<HTMLButtonElement, ApplyFormatButtonProps>(
  ({ editor, ...buttonProps }, ref) => {
    const { applyFormat, hasCopiedFormat, canApply } = useFormatPainter({ editor })

    if (!hasCopiedFormat) return null

    return (
      <FormatPainterControlButton
        editor={editor}
        icon={<ApplyFormatIcon className="tiptap-button-icon" />}
        ariaLabel="Применить форматирование"
        tooltip="Применить форматирование"
        isDisabled={!canApply}
        onAction={applyFormat}
        {...buttonProps}
        ref={ref}
      />
    )
  }
)

ApplyFormatButton.displayName = "ApplyFormatButton"
