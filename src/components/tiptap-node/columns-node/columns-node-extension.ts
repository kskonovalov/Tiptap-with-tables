import { mergeAttributes, Node } from "@tiptap/core"
import { TextSelection } from "@tiptap/pm/state"

export type ColumnsCount = 2 | 3

export interface ColumnsNodeOptions {
  HTMLAttributes: Record<string, any>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    columns: {
      /**
       * Set columns node
       */
      setColumns: (options?: { columns?: ColumnsCount }) => ReturnType
      /**
       * Update columns count
       */
      updateColumnsCount: (columns: ColumnsCount) => ReturnType
      /**
       * Shift columns (rotate order)
       */
      shiftColumns: () => ReturnType
    }
  }
}

export const ColumnsNode = Node.create<ColumnsNodeOptions>({
  name: "columns",

  group: "block",

  content: "columnItem+",

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      columns: {
        default: 2,
        parseHTML: (element) => {
          const cols = element.getAttribute("data-columns")
          return cols ? parseInt(cols, 10) : 2
        },
        renderHTML: (attributes) => {
          return {
            "data-columns": attributes.columns,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-columns]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        {
          class: `columns columns-${HTMLAttributes.columns}`,
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0,
    ]
  },

  addCommands() {
    return {
      setColumns:
        (options = {}) =>
        ({ state, dispatch }) => {
          const columns = options.columns || 2
          const { from, to } = state.selection
          
          // Создать columnItem ноды
          const columnItems = []
          for (let i = 0; i < columns; i++) {
            columnItems.push(
              state.schema.nodes.columnItem.create(null, [
                state.schema.nodes.paragraph.create(),
              ])
            )
          }
          
          // Создать columns node
          const columnsNode = state.schema.nodes.columns.create(
            { columns },
            columnItems
          )
          
          const tr = state.tr
          tr.replaceRangeWith(from, to, columnsNode)
          
          // Установить курсор в первую колонку
          const firstColumnPos = from + 2
          const resolvedPos = tr.doc.resolve(firstColumnPos)
          const selection = TextSelection.near(resolvedPos)
          tr.setSelection(selection)
          
          if (dispatch) {
            dispatch(tr)
          }
          
          return true
        },
      updateColumnsCount:
        (columns) =>
        ({ state, dispatch }) => {
          const { $from } = state.selection
          
          // Найти родительский columns node
          let columnsPos = -1
          let columnsNode = null
          
          for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d)
            if (node.type.name === "columns") {
              columnsPos = $from.start(d) - 1
              columnsNode = node
              break
            }
          }
          
          if (!columnsNode || columnsPos === -1) return false
          
          const currentColumns = columnsNode.attrs.columns
          
          if (currentColumns === columns) return false
          
          // Собрать существующий контент из колонок
          const existingContent: any[] = []
          columnsNode.forEach((child) => {
            if (child.type.name === "columnItem") {
              existingContent.push(child.content)
            }
          })
          
          // Создать новые columnItem ноды
          const newColumnItems = []
          for (let i = 0; i < columns; i++) {
            if (existingContent[i]) {
              // Использовать существующий контент
              newColumnItems.push(
                state.schema.nodes.columnItem.create(null, existingContent[i])
              )
            } else {
              // Создать пустую колонку
              newColumnItems.push(
                state.schema.nodes.columnItem.create(null, [
                  state.schema.nodes.paragraph.create(),
                ])
              )
            }
          }
          
          // Создать новый columns node с обновленным количеством
          const newColumnsNode = state.schema.nodes.columns.create(
            { columns },
            newColumnItems
          )
          
          const tr = state.tr
          tr.replaceWith(columnsPos, columnsPos + columnsNode.nodeSize, newColumnsNode)
          
          if (dispatch) {
            dispatch(tr)
          }
          
          return true
        },
      shiftColumns:
        () =>
        ({ state, dispatch }) => {
          const { $from } = state.selection
          
          // Найти родительский columns node
          let columnsPos = -1
          let columnsNode = null
          
          for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d)
            if (node.type.name === "columns") {
              columnsPos = $from.start(d) - 1
              columnsNode = node
              break
            }
          }
          
          if (!columnsNode || columnsPos === -1) return false
          
          // Собрать контент всех колонок
          const columnContents: any[] = []
          columnsNode.forEach((child) => {
            if (child.type.name === "columnItem") {
              columnContents.push(child.content)
            }
          })
          
          if (columnContents.length < 2) return false
          
          // Сдвинуть массив (последний элемент в начало)
          const shiftedContents = [
            columnContents[columnContents.length - 1],
            ...columnContents.slice(0, -1)
          ]
          
          // Создать новые columnItem ноды с новым порядком
          const newColumnItems = shiftedContents.map((content) => {
            return state.schema.nodes.columnItem.create(null, content)
          })
          
          // Создать новый columns node
          const newColumnsNode = state.schema.nodes.columns.create(
            { columns: columnsNode.attrs.columns },
            newColumnItems
          )
          
          const tr = state.tr
          tr.replaceWith(columnsPos, columnsPos + columnsNode.nodeSize, newColumnsNode)
          
          if (dispatch) {
            dispatch(tr)
          }
          
          return true
        },
    }
  },
})

export const ColumnItem = Node.create({
  name: "columnItem",

  content: "block+",

  defining: true,

  selectable: false,

  isolating: true,

  parseHTML() {
    return [
      {
        tag: "div.column-item",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ class: "column-item" }, HTMLAttributes),
      0,
    ]
  },
})

export default ColumnsNode
