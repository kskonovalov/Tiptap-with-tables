import { forwardRef, useCallback } from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "../../../hooks/use-tiptap-editor"

// --- UI Primitives ---
import type { ButtonProps } from "../../tiptap-ui-primitive/button/index"
import { Button } from "../../tiptap-ui-primitive/button/index"

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
  | "toggleHeaderRow"

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
  toggleHeaderRow: "Заголовки",
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

    // Проверить есть ли заголовки в таблице
    const hasHeaderRow = useCallback(() => {
      if (!editor) return false
      
      const { state } = editor
      const { selection } = state
      const { $from } = selection

      // Найти table node
      for (let d = $from.depth; d > 0; d--) {
        const node = $from.node(d)
        if (node.type.name === "table") {
          const firstRow = node.firstChild
          if (firstRow && firstRow.type.name === "tableRow") {
            let hasHeader = false
            firstRow.forEach((cell) => {
              if (cell.type.name === "tableHeader") {
                hasHeader = true
              }
            })
            return hasHeader
          }
          break
        }
      }
      return false
    }, [editor])

    // Динамический текст для toggleHeaderRow
    const getActionLabel = useCallback(() => {
      if (action === "toggleHeaderRow") {
        return hasHeaderRow() ? "Убрать заголовки" : "Добавить заголовки"
      }
      return text || actionLabels[action]
    }, [action, text, hasHeaderRow])

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
            case "toggleHeaderRow":
              editor.chain().focus().toggleHeaderRow().run()
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

    const label = getActionLabel()

    return (
      <Button
        type="button"
        data-style="ghost"
        role="button"
        tabIndex={-1}
        disabled={!editor}
        aria-label={label}
        tooltip={showTooltip ? label : undefined}
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        <span className="tiptap-button-text">
          {label}
        </span>
      </Button>
    )
  }
)

TableActionButton.displayName = "TableActionButton"

