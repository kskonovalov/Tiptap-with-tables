import { forwardRef, useCallback, useState } from "react"

// --- Icons ---
import { ChevronDownIcon } from "../../tiptap-icons/chevron-down-icon"

// --- Styles ---
import "./fontfamily-dropdown-menu.scss"

// --- Hooks ---
import { useTiptapEditor } from "../../../hooks/use-tiptap-editor"

// --- Tiptap UI ---
import type { UseFontFamilyDropdownMenuConfig } from "./index"
import { useFontFamilyDropdownMenu } from "./index"

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

export interface FontFamilyDropdownMenuProps
  extends Omit<ButtonProps, "type">,
    UseFontFamilyDropdownMenuConfig {
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
 * Dropdown menu component for selecting font family in a Tiptap editor.
 */
export const FontFamilyDropdownMenu = forwardRef<
  HTMLButtonElement,
  FontFamilyDropdownMenuProps
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
      currentFontFamily,
      canSet,
      families,
      handleSet,
      Icon,
    } = useFontFamilyDropdownMenu({
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
      (fontFamily: string) => {
        const isCurrentlySelected = currentFontFamily === fontFamily

        if (isCurrentlySelected) {
          if (editor) {
            editor.chain().focus().unsetFontFamily().run()
          }
        } else {
          handleSet(fontFamily)
        }
        setIsOpen(false)
      },
      [handleSet, currentFontFamily, editor]
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
            data-active-state={currentFontFamily ? "on" : "off"}
            role="button"
            tabIndex={-1}
            disabled={!canSet}
            data-disabled={!canSet}
            aria-label="Шрифт"
            aria-pressed={!!currentFontFamily}
            tooltip="Шрифт"
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
              <DropdownMenuItem
                onClick={() => {
                  editor?.chain().focus().unsetFontFamily().run()
                  setIsOpen(false)
                }}
                data-active={!currentFontFamily}
              >
                По умолчанию
              </DropdownMenuItem>
              {families.map((option) => (
                <DropdownMenuItem
                  key={option.type}
                  onClick={() => handleSelect(option.value)}
                  data-active={currentFontFamily === option.value}
                >
                  <span className="fontfamily-preview-wrapper">
                    <span
                      className="fontfamily-preview-label"
                      style={{ fontFamily: option.value }}
                    >
                      {option.label}
                    </span>
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

FontFamilyDropdownMenu.displayName = "FontFamilyDropdownMenu"
