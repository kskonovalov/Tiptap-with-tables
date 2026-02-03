import { Table as TiptapTable } from "@tiptap/extension-table"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { TableFilterComponent } from "./table-filter"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    tableFilter: {
      /**
       * Toggle header row (th <-> td)
       */
      toggleHeaderRow: () => ReturnType
    }
  }
}

export const TableFilter = TiptapTable.extend({
  name: "table",

  addAttributes() {
    return {
      ...this.parent?.(),
      filters: {
        default: {},
        parseHTML: (element) => {
          const filters = element.getAttribute("data-filters")
          return filters ? JSON.parse(filters) : {}
        },
        renderHTML: (attributes) => {
          if (!attributes.filters || Object.keys(attributes.filters).length === 0) {
            return {}
          }
          return {
            "data-filters": JSON.stringify(attributes.filters),
          }
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(TableFilterComponent, {
      contentDOMElementTag: "tbody",
    })
  },

  addCommands() {
    return {
      ...this.parent?.(),
      toggleHeaderRow:
        () =>
        ({ state, dispatch }) => {
          const { selection } = state
          const { $from } = selection

          // Найти table node
          let tableDepth = -1
          for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type.name === "table") {
              tableDepth = d
              break
            }
          }

          if (tableDepth === -1) return false

          const tableNode = $from.node(tableDepth)
          const tablePos = $from.start(tableDepth) - 1

          // Получить первую строку
          const firstRow = tableNode.firstChild
          if (!firstRow || firstRow.type.name !== "tableRow") return false

          // Проверить тип ячеек первой строки
          let hasHeader = false
          firstRow.forEach((cell) => {
            if (cell.type.name === "tableHeader") {
              hasHeader = true
            }
          })

          // Определить новый тип ячейки
          const newCellType = hasHeader ? "tableCell" : "tableHeader"
          const newCellTypeObj = state.schema.nodes[newCellType]

          if (!newCellTypeObj) return false

          const tr = state.tr
          let currentPos = tablePos + 2 // +1 для table, +1 для tableRow

          // Заменить все ячейки в первой строке
          firstRow.forEach((cell) => {
            tr.setNodeMarkup(currentPos, newCellTypeObj, cell.attrs)
            currentPos += cell.nodeSize
          })

          if (dispatch) {
            dispatch(tr)
          }

          return true
        },
    }
  },
})
