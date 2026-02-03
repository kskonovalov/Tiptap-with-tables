import { forwardRef, useCallback, useState } from "react"

// --- Icons ---
import { ChevronDownIcon } from "../../tiptap-icons/chevron-down-icon"

// --- Styles ---
import "./color-dropdown-menu.scss"

// --- Hooks ---
import { useTiptapEditor } from "../../../hooks/use-tiptap-editor"

// --- Tiptap UI ---
import type { UseColorDropdownMenuConfig } from "./index"
import { useColorDropdownMenu } from "./index"

// --- UI Primitives ---
import type { ButtonProps } from "../../tiptap-ui-primitive/button/index"
import { Button } from "../../tiptap-ui-primitive/button/index"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../tiptap-ui-primitive/dropdown-menu/index"
import { Card, CardBody } from "../../tiptap-ui-primitive/card/index"

export interface ColorDropdownMenuProps
  extends Omit<ButtonProps, "type">,
    UseColorDropdownMenuConfig {
  /**
   * Whether to render the dropdown menu in a portal
   * @default false
   */
  portal?: boolean
  /**
   * Callback for when the dropdown opens or closes
   */
  onOpenChange?: (isOpen: boolean) => void
}

/**
 * Dropdown menu component for selecting text color in a Tiptap editor.
 */
export const ColorDropdownMenu = forwardRef<
  HTMLButtonElement,
  ColorDropdownMenuProps
>(
  (
    {
      editor: providedEditor,
      hideWhenUnavailable = false,
      portal = false,
      onOpenChange,
      ...buttonProps
    },
    ref
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const {
      isVisible,
      currentColor,
      canSet,
      colors,
      handleSet,
      Icon,
    } = useColorDropdownMenu({
      editor,
      hideWhenUnavailable,
    })

    const handleOpenChange = useCallback(
      (open: boolean) => {
        if (!editor || !canSet) return
        setIsOpen(open)
        onOpenChange?.(open)
      },
      [canSet, editor, onOpenChange]
    )

    const handleSelect = useCallback(
      (color: string) => {
        handleSet(color)
        setIsOpen(false)
      },
      [handleSet]
    )

    if (!isVisible) {
      return null
    }

    return (
      <DropdownMenu modal open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            data-style="ghost"
            data-active-state={currentColor ? "on" : "off"}
            role="button"
            tabIndex={-1}
            disabled={!canSet}
            data-disabled={!canSet}
            aria-label="Цвет текста"
            aria-pressed={!!currentColor}
            tooltip="Цвет текста"
            {...buttonProps}
            ref={ref}
          >
            <Icon className="tiptap-button-icon" />
            <ChevronDownIcon className="tiptap-button-dropdown-small" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="start" portal={portal}>
          <Card>
            <CardBody>
              {colors.map((option) => (
                <DropdownMenuItem
                  key={option.type}
                  onClick={() => handleSelect(option.value)}
                  data-active={currentColor === option.value}
                >
                  <span className="color-preview-wrapper">
                    <span
                      className="color-preview-dot"
                      style={{
                        backgroundColor: option.value || "currentColor",
                      }}
                    />
                    <span className="color-preview-label">{option.label}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </CardBody>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)

ColorDropdownMenu.displayName = "ColorDropdownMenu"
