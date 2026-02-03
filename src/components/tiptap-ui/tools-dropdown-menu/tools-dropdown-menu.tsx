"use client"

import { forwardRef, useCallback, useState } from "react"
import type { ReactNode } from "react"

// --- Icons ---
import { WrenchIcon } from "../../tiptap-icons/wrench-icon"
import { ChevronDownIcon } from "../../tiptap-icons/chevron-down-icon"

// --- UI Primitives ---
import type { ButtonProps } from "../../tiptap-ui-primitive/button/index"
import { Button } from "../../tiptap-ui-primitive/button/index"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "../../tiptap-ui-primitive/dropdown-menu/index"
import { Card, CardBody } from "../../tiptap-ui-primitive/card/index"

export interface ToolsDropdownMenuProps extends Omit<ButtonProps, "type"> {
  /**
   * Whether to render the dropdown menu in a portal
   * @default false
   */
  portal?: boolean
  /**
   * Callback for when the dropdown opens or closes
   */
  onOpenChange?: (isOpen: boolean) => void
  /**
   * Children to render inside the dropdown
   */
  children?: ReactNode
}

/**
 * Dropdown menu component for tools in a Tiptap editor.
 */
export const ToolsDropdownMenu = forwardRef<
  HTMLButtonElement,
  ToolsDropdownMenuProps
>(
  (
    {
      portal = false,
      onOpenChange,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState<boolean>(false)

    const handleOpenChange = useCallback(
      (open: boolean) => {
        setIsOpen(open)
        onOpenChange?.(open)
      },
      [onOpenChange]
    )

    return (
      <DropdownMenu modal={false} open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            data-style="ghost"
            role="button"
            tabIndex={-1}
            aria-label="Инструменты"
            tooltip="Инструменты"
            {...buttonProps}
            ref={ref}
          >
            <WrenchIcon className="tiptap-button-icon" />
            <ChevronDownIcon className="tiptap-button-dropdown-small" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          side="bottom" 
          align="start" 
          portal={portal}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <Card>
            <CardBody>
              {children}
            </CardBody>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)

ToolsDropdownMenu.displayName = "ToolsDropdownMenu"
