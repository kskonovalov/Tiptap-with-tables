import { forwardRef, useCallback } from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"

export type TableAction =
  | "addColumnBefore"
  | "addColumnAfter"
  | "deleteColumn"
  | "addRowBefore"
  | "addRowAfter"
  | "deleteRow"
  | "deleteTable"
  | "mergeCells"
  | "splitCell"

export interface TableActionButtonProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null
  action: TableAction
  text?: string
  showTooltip?: boolean
}

const actionLabels: Record<TableAction, string> = {
  addColumnBefore: "Добавить столбец перед",
  addColumnAfter: "Добавить столбец после",
  deleteColumn: "Удалить столбец",
  addRowBefore: "Добавить строку перед",
  addRowAfter: "Добавить строку после",
  deleteRow: "Удалить строку",
  deleteTable: "Удалить таблицу",
  mergeCells: "Объединить ячейки",
  splitCell: "Разделить ячейку",
}

export const TableActionButton = forwardRef<
  HTMLButtonElement,
  TableActionButtonProps
>(
  (
    {
      editor: providedEditor,
      action,
      text,
      showTooltip = true,
      onClick,
      ...buttonProps
    },
    ref
  ) => {
    const { editor } = useTiptapEditor(providedEditor)

    const isInTable = editor?.isActive("table") || false

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (!editor) return

        try {
          switch (action) {
            case "addColumnBefore":
              editor.chain().focus().addColumnBefore().run()
              break
            case "addColumnAfter":
              editor.chain().focus().addColumnAfter().run()
              break
            case "deleteColumn":
              editor.chain().focus().deleteColumn().run()
              break
            case "addRowBefore":
              editor.chain().focus().addRowBefore().run()
              break
            case "addRowAfter":
              editor.chain().focus().addRowAfter().run()
              break
            case "deleteRow":
              editor.chain().focus().deleteRow().run()
              break
            case "deleteTable":
              editor.chain().focus().deleteTable().run()
              break
            case "mergeCells":
              editor.chain().focus().mergeCells().run()
              break
            case "splitCell":
              editor.chain().focus().splitCell().run()
              break
          }
        } catch (e) {
          console.error("Table action failed:", e)
        }
      },
      [editor, action, onClick]
    )

    if (!isInTable) {
      return null
    }

    return (
      <Button
        type="button"
        data-style="ghost"
        role="button"
        tabIndex={-1}
        disabled={!editor}
        aria-label={actionLabels[action]}
        tooltip={showTooltip ? actionLabels[action] : undefined}
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        <span className="tiptap-button-text">
          {text || actionLabels[action]}
        </span>
      </Button>
    )
  }
)

TableActionButton.displayName = "TableActionButton"

