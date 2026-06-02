import { forwardRef } from "react"
import type { Editor } from "@tiptap/react"

import { useFormatPainter } from "./use-format-painter"
import { FormatPainterControlButton } from "./format-painter-control-button"
import type { ButtonProps } from "../../tiptap-ui-primitive/button/index"
import { FormatPainterIcon } from "../../tiptap-icons/format-painter-icon"

export interface FormatPainterButtonProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null
}

export const FormatPainterButton = forwardRef<HTMLButtonElement, FormatPainterButtonProps>(
  ({ editor, ...buttonProps }, ref) => {
    const { copyFormat, hasCopiedFormat, canCopy } = useFormatPainter({ editor })

    return (
      <FormatPainterControlButton
        editor={editor}
        icon={<FormatPainterIcon className="tiptap-button-icon" />}
        ariaLabel="Форматировать по образцу"
        tooltip="Форматировать по образцу"
        isActive={hasCopiedFormat}
        isDisabled={!canCopy}
        onAction={copyFormat}
        {...buttonProps}
        ref={ref}
      />
    )
  }
)

FormatPainterButton.displayName = "FormatPainterButton"
