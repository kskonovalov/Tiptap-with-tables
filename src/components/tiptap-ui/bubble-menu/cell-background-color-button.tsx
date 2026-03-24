"use client"

import { useState } from "react"
import type { Editor } from "@tiptap/react"
import { CellSelection } from "@tiptap/pm/tables"

// --- Icons ---
import { PaletteIcon } from "../../tiptap-icons/palette-icon"
import { BanIcon } from "../../tiptap-icons/ban-icon"

// --- UI Primitives ---
import { Button } from "../../tiptap-ui-primitive/button/index"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../../tiptap-ui-primitive/popover/index"

// --- Colors ---
import { COLOR_OPTIONS } from "../../tiptap-node/color-node/constants"

// --- Styles (reuse highlight swatch class) ---
import "../color-highlight-button/color-highlight-button.scss"
import { getSelectedNodesOfType } from "../../../lib/tiptap-utils"

const CELL_NODE_TYPES = ["tableCell", "tableHeader"]

function getActiveCellColor(editor: Editor): string | null {
  const nodes = getSelectedNodesOfType(editor.state.selection, CELL_NODE_TYPES)
  if (nodes.length === 0) return null
  const first = nodes[0].node.attrs?.backgroundColor ?? null
  return nodes.every((n) => n.node.attrs?.backgroundColor === first)
    ? first
    : null
}

export interface CellBackgroundColorButtonProps {
  editor?: Editor | null
}

export function CellBackgroundColorButton({
  editor,
}: CellBackgroundColorButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!editor) return null

  const isCellSelection = editor.state.selection instanceof CellSelection
  if (!isCellSelection) return null

  const canApply =
    editor.isEditable &&
    editor.can().toggleNodeBackgroundColor(COLOR_OPTIONS[1].value)

  const activeColor = getActiveCellColor(editor)

  const handleColor = (value: string) => {
    editor.chain().focus().toggleNodeBackgroundColor(value).run()
    setIsOpen(false)
  }

  const handleClear = () => {
    editor.chain().focus().unsetNodeBackgroundColor().run()
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          data-style="ghost"
          role="button"
          tabIndex={-1}
          disabled={!canApply}
          data-disabled={!canApply}
          aria-label="Цвет фона ячейки"
          tooltip="Цвет фона ячейки"
          data-active-state={activeColor ? "on" : "off"}
          aria-pressed={!!activeColor}
        >
          <PaletteIcon className="tiptap-button-icon" />
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Цвет фона ячейки">
        <div className="cell-bg-color-picker">
          {COLOR_OPTIONS.filter((opt) => opt.type !== "default").map((opt) => (
            <Button
              key={opt.type}
              type="button"
              data-style="ghost"
              role="button"
              tabIndex={-1}
              aria-label={opt.label}
              tooltip={opt.label}
              data-active-state={activeColor === opt.value ? "on" : "off"}
              onClick={() => handleColor(opt.value)}
              style={
                {
                  "--highlight-color": opt.value,
                } as React.CSSProperties
              }
            >
              <span className="tiptap-button-highlight" />
            </Button>
          ))}
          <Button
            type="button"
            data-style="ghost"
            role="button"
            tabIndex={-1}
            aria-label="Убрать фон"
            tooltip="Убрать фон"
            onClick={handleClear}
          >
            <BanIcon className="tiptap-button-icon" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
