import { forwardRef, useCallback, useState } from "react"

// --- Icons ---
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon"

// --- Styles ---
import "@/components/tiptap-ui/alert-dropdown-menu/alert-dropdown-menu.scss"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Tiptap UI ---
import type { UseAlertDropdownMenuConfig } from "@/components/tiptap-ui/alert-dropdown-menu"
import { useAlertDropdownMenu } from "@/components/tiptap-ui/alert-dropdown-menu"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/tiptap-ui-primitive/dropdown-menu"
import { Card, CardBody } from "@/components/tiptap-ui-primitive/card"

// --- Types ---
import type { AlertType } from "@/components/tiptap-node/alert-node"

const ALERT_LABELS: Record<AlertType, string> = {
  primary: "Основное",
  secondary: "Дополнительное",
  info: "Информация",
  success: "Успех",
  warning: "Предупреждение",
  error: "Ошибка",
}

export interface AlertDropdownMenuProps
  extends Omit<ButtonProps, "type">,
    UseAlertDropdownMenuConfig {
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
 * Dropdown menu component for selecting alert types in a Tiptap editor.
 */
export const AlertDropdownMenu = forwardRef<
  HTMLButtonElement,
  AlertDropdownMenuProps
>(
  (
    {
      editor: providedEditor,
      types = ["primary", "secondary", "info", "success", "warning", "error"],
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
      currentType,
      canToggle,
      handleToggle,
      Icon,
    } = useAlertDropdownMenu({
      editor,
      types,
      hideWhenUnavailable,
    })

    const handleOpenChange = useCallback(
      (open: boolean) => {
        if (!editor || !canToggle) return
        setIsOpen(open)
        onOpenChange?.(open)
      },
      [canToggle, editor, onOpenChange]
    )

    const handleSelect = useCallback(
      (type: AlertType) => {
        handleToggle(type)
        setIsOpen(false)
      },
      [handleToggle]
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
            data-active-state={isActive ? "on" : "off"}
            role="button"
            tabIndex={-1}
            disabled={!canToggle}
            data-disabled={!canToggle}
            aria-label="Вставить предупреждение"
            aria-pressed={isActive}
            tooltip="Предупреждение"
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
              {types.map((type) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => handleSelect(type)}
                  data-active={isActive && currentType === type}
                >
                  <span className={`alert-preview alert-preview-${type}`}>
                    {ALERT_LABELS[type]}
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

AlertDropdownMenu.displayName = "AlertDropdownMenu"
