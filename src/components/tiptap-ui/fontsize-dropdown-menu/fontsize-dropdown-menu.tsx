import { forwardRef, useCallback, useState } from "react"

// --- Icons ---
import { ChevronDownIcon } from "../../tiptap-icons/chevron-down-icon"

// --- Styles ---
import "./fontsize-dropdown-menu.scss"

// --- Hooks ---
import { useTiptapEditor } from "../../../hooks/use-tiptap-editor"

// --- Tiptap UI ---
import type { UseFontSizeDropdownMenuConfig } from "./index"
import { useFontSizeDropdownMenu } from "./index"

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

export interface FontSizeDropdownMenuProps
  extends Omit<ButtonProps, "type">,
    UseFontSizeDropdownMenuConfig {
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
 * Dropdown menu component for selecting font size in a Tiptap editor.
 */
export const FontSizeDropdownMenu = forwardRef<
  HTMLButtonElement,
  FontSizeDropdownMenuProps
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
      currentFontSize,
      canSet,
      sizes,
      handleSet,
      Icon,
    } = useFontSizeDropdownMenu({
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
      (fontSize: string) => {
        // Toggle: if clicking the same font size, unset it
        const isCurrentlySelected = 
          currentFontSize === fontSize || 
          (fontSize === "1em" && !currentFontSize)
        
        if (isCurrentlySelected) {
          // Unset font size
          if (editor) {
            editor.chain().focus().unsetFontSize().run()
          }
        } else {
          handleSet(fontSize)
        }
        setIsOpen(false)
      },
      [handleSet, currentFontSize, editor]
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
            data-active-state={currentFontSize && currentFontSize !== "1em" ? "on" : "off"}
            role="button"
            tabIndex={-1}
            disabled={!canSet}
            data-disabled={!canSet}
            aria-label="Размер шрифта"
            aria-pressed={!!(currentFontSize && currentFontSize !== "1em")}
            tooltip="Размер шрифта"
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
              {sizes.map((option) => (
                <DropdownMenuItem
                  key={option.type}
                  onClick={() => handleSelect(option.value)}
                  data-active={currentFontSize === option.value || (option.value === "1em" && !currentFontSize)}
                >
                  <span className="fontsize-preview-wrapper">
                    <span className="fontsize-preview-label">{option.label}</span>
                    <span className="fontsize-preview-value">{option.value}</span>
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

FontSizeDropdownMenu.displayName = "FontSizeDropdownMenu"
