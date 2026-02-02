import { forwardRef, useCallback, useState } from "react"

// --- Icons ---
import { ChevronDownIcon } from "../../tiptap-icons/chevron-down-icon"

// --- Hooks ---
import { useTiptapEditor } from "../../../hooks/use-tiptap-editor"

// --- Tiptap UI ---
import type { UseColumnsDropdownMenuConfig } from "./index"
import { useColumnsDropdownMenu } from "./index"

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

// --- Types ---
import type { ColumnsCount } from "../../tiptap-node/columns-node/index"

const COLUMNS_LABELS: Record<ColumnsCount, string> = {
  2: "2 колонки",
  3: "3 колонки",
}

export interface ColumnsDropdownMenuProps
  extends Omit<ButtonProps, "type">,
    UseColumnsDropdownMenuConfig {
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
 * Dropdown menu component for selecting columns count in a Tiptap editor.
 */
export const ColumnsDropdownMenu = forwardRef<
  HTMLButtonElement,
  ColumnsDropdownMenuProps
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
      isActive,
      currentColumns,
      canSet,
      handleSet,
      handleShift,
      Icon,
    } = useColumnsDropdownMenu({
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
      (columns: ColumnsCount) => {
        handleSet(columns)
        setIsOpen(false)
      },
      [handleSet]
    )

    const handleShiftClick = useCallback(() => {
      handleShift()
      setIsOpen(false)
    }, [handleShift])

    if (!isVisible) {
      return null
    }

    return (
      <DropdownMenu modal open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            data-style="ghost"
            data-active-state={isActive ? "on" : "off"}
            role="button"
            tabIndex={-1}
            disabled={!canSet}
            data-disabled={!canSet}
            aria-label="Вставить колонки"
            aria-pressed={isActive}
            tooltip="Колонки"
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
              {([2, 3] as ColumnsCount[]).map((count) => (
                <DropdownMenuItem
                  key={count}
                  onClick={() => handleSelect(count)}
                  data-active={isActive && currentColumns === count}
                >
                  {COLUMNS_LABELS[count]}
                </DropdownMenuItem>
              ))}
              
              {isActive && (
                <>
                  <div style={{ 
                    height: "1px", 
                    background: "var(--tt-gray-light-a-200)", 
                    margin: "0.5rem 0" 
                  }} />
                  <DropdownMenuItem onClick={handleShiftClick}>
                    Сдвинуть колонки
                  </DropdownMenuItem>
                </>
              )}
            </CardBody>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)

ColumnsDropdownMenu.displayName = "ColumnsDropdownMenu"
