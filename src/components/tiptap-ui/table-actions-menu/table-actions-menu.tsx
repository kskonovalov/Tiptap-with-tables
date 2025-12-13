import { useCallback, useState } from "react"
import { type Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon"
import { TableIcon } from "@/components/tiptap-icons/table-icon"

// --- Tiptap UI ---
import { TableActionButton } from "@/components/tiptap-ui/table-action-button"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button, ButtonGroup } from "@/components/tiptap-ui-primitive/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/tiptap-ui-primitive/dropdown-menu"
import { Card, CardBody } from "@/components/tiptap-ui-primitive/card"

export interface TableActionsMenuProps extends Omit<ButtonProps, "type"> {
  editor?: Editor
  onOpenChange?: (isOpen: boolean) => void
  portal?: boolean
}

export function TableActionsMenu({
  editor: providedEditor,
  onOpenChange,
  portal = false,
  ...props
}: TableActionsMenuProps) {
  const { editor } = useTiptapEditor(providedEditor)
  const [isOpen, setIsOpen] = useState(false)

  const isInTable = editor?.isActive("table") || false

  const handleOnOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open)
      onOpenChange?.(open)
    },
    [onOpenChange]
  )

  if (!isInTable) {
    return null
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOnOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          data-style="ghost"
          role="button"
          tabIndex={-1}
          aria-label="Действия с таблицей"
          tooltip="Действия с таблицей"
          {...props}
        >
          <TableIcon className="tiptap-button-icon" />
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" portal={portal}>
        <Card>
          <CardBody>
            <ButtonGroup>
              <DropdownMenuItem asChild>
                <TableActionButton
                  editor={editor}
                  action="addColumnBefore"
                  showTooltip={false}
                />
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <TableActionButton
                  editor={editor}
                  action="addColumnAfter"
                  showTooltip={false}
                />
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <TableActionButton
                  editor={editor}
                  action="deleteColumn"
                  showTooltip={false}
                />
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <TableActionButton
                  editor={editor}
                  action="addRowBefore"
                  showTooltip={false}
                />
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <TableActionButton
                  editor={editor}
                  action="addRowAfter"
                  showTooltip={false}
                />
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <TableActionButton
                  editor={editor}
                  action="deleteRow"
                  showTooltip={false}
                />
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <TableActionButton
                  editor={editor}
                  action="mergeCells"
                  showTooltip={false}
                />
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <TableActionButton
                  editor={editor}
                  action="splitCell"
                  showTooltip={false}
                />
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <TableActionButton
                  editor={editor}
                  action="deleteTable"
                  showTooltip={false}
                />
              </DropdownMenuItem>
            </ButtonGroup>
          </CardBody>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default TableActionsMenu

