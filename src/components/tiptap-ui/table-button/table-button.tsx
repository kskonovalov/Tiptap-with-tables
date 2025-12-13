import { forwardRef, useCallback } from "react"

// --- Tiptap UI ---
import type { UseTableConfig } from "@/components/tiptap-ui/table-button"
import { useTable } from "@/components/tiptap-ui/table-button"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"

export interface TableButtonProps
  extends Omit<ButtonProps, "type">,
    UseTableConfig {
  /**
   * Optional text to display alongside the icon.
   */
  text?: string
}

/**
 * Button component for inserting tables in a Tiptap editor.
 *
 * For custom button implementations, use the `useTable` hook instead.
 */
export const TableButton = forwardRef<HTMLButtonElement, TableButtonProps>(
  (
    {
      editor: providedEditor,
      text,
      hideWhenUnavailable = false,
      onInserted,
      rows = 3,
      cols = 3,
      withHeaderRow = true,
      onClick,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const { isVisible, canInsert, isActive, handleInsert, label, Icon } =
      useTable({
        editor,
        hideWhenUnavailable,
        onInserted,
        rows,
        cols,
        withHeaderRow,
      })

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        handleInsert()
      },
      [handleInsert, onClick]
    )

    if (!isVisible) {
      return null
    }

    return (
      <Button
        type="button"
        data-style="ghost"
        data-active-state={isActive ? "on" : "off"}
        role="button"
        tabIndex={-1}
        disabled={!canInsert}
        data-disabled={!canInsert}
        aria-label={label}
        tooltip="Вставить таблицу"
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <>
            <Icon className="tiptap-button-icon" />
            {text && <span className="tiptap-button-text">{text}</span>}
          </>
        )}
      </Button>
    )
  }
)

TableButton.displayName = "TableButton"

