import { forwardRef, useCallback } from "react"
import type { Editor } from "@tiptap/react"

import { useTiptapEditor } from "../../../hooks/use-tiptap-editor"
import type { ButtonProps } from "../../tiptap-ui-primitive/button/index"
import { Button } from "../../tiptap-ui-primitive/button/index"

export interface FormatPainterControlButtonProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null
  icon: React.ReactNode
  ariaLabel: string
  tooltip: string
  isActive?: boolean
  isDisabled: boolean
  onAction: () => void
}

export const FormatPainterControlButton = forwardRef<HTMLButtonElement, FormatPainterControlButtonProps>(
  ({ editor: providedEditor, icon, ariaLabel, tooltip, isActive, isDisabled, onAction, onClick, ...buttonProps }, ref) => {
    useTiptapEditor(providedEditor)

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        onAction()
      },
      [onClick, onAction]
    )

    return (
      <Button
        type="button"
        disabled={isDisabled}
        data-style="ghost"
        data-active-state={isActive ? "on" : "off"}
        data-disabled={isDisabled}
        role="button"
        aria-label={ariaLabel}
        aria-pressed={isActive}
        tooltip={tooltip}
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        {icon}
      </Button>
    )
  }
)

FormatPainterControlButton.displayName = "FormatPainterControlButton"
