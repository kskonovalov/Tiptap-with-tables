import { mergeAttributes, Node } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { WarningNodeComponent } from "./warning-node"

export interface WarningNodeOptions {
  HTMLAttributes: Record<string, any>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    warning: {
      /**
       * Set a warning node
       */
      setWarning: () => ReturnType
      /**
       * Toggle warning node
       */
      toggleWarning: () => ReturnType
    }
  }
}

export const WarningNode = Node.create<WarningNodeOptions>({
  name: "warning",

  group: "block",

  content: "warningTitle warningMessage",

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-warning="true"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        {
          "data-warning": "true",
          class: "warning",
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(WarningNodeComponent)
  },

  addCommands() {
    return {
      setWarning:
        () =>
        ({ chain, state, tr, dispatch }) => {
          const { from, to } = state.selection
          
          // Создать ноды
          const warningTitleNode = state.schema.nodes.warningTitle.create()
          const paragraphNode = state.schema.nodes.paragraph.create()
          const warningMessageNode = state.schema.nodes.warningMessage.create(null, [paragraphNode])
          const warningNode = state.schema.nodes.warning.create(null, [warningTitleNode, warningMessageNode])
          
          // Вставить warning node
          tr.replaceRangeWith(from, to, warningNode)
          
          // Установить курсор внутри warningTitle (первая дочерняя нода)
          const titlePos = from + 1
          const resolvedPos = tr.doc.resolve(titlePos)
          const selection = state.selection.constructor.near(resolvedPos)
          tr.setSelection(selection)
          
          if (dispatch) {
            dispatch(tr)
          }
          
          return true
        },
      toggleWarning:
        () =>
        ({ commands, editor }) => {
          if (editor.isActive(this.name)) {
            return false
          }
          return commands.setWarning()
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-w": () => this.editor.commands.setWarning(),
    }
  },
})

export const WarningTitle = Node.create({
  name: "warningTitle",

  content: "inline*",

  defining: true,

  selectable: false,

  parseHTML() {
    return [
      {
        tag: "div.warning-title",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ class: "warning-title" }, HTMLAttributes),
      0,
    ]
  },

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const { state } = editor
        const { $from } = state.selection

        // Найти родительский warning node
        let warningDepth = -1
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === "warning") {
            warningDepth = d
            break
          }
        }

        if (warningDepth === -1) return false

        // Проверить что мы в warningTitle
        for (let d = $from.depth; d > warningDepth; d--) {
          if ($from.node(d).type.name === "warningTitle") {
            // Найти позицию warningMessage и переместить в конец
            const warningNode = $from.node(warningDepth)
            let messageNode = null
            let messageOffset = -1
            
            warningNode.forEach((child, offset) => {
              if (child.type.name === "warningMessage" && messageOffset === -1) {
                messageNode = child
                messageOffset = offset
              }
            })

            if (messageNode && messageOffset >= 0) {
              const absolutePos = $from.start(warningDepth) + messageOffset + 1
              // Найти последний параграф и переместить в его конец
              const lastChild = messageNode.lastChild
              if (lastChild) {
                const endPos = absolutePos + messageNode.content.size - lastChild.nodeSize + lastChild.content.size
                editor.commands.focus(endPos)
                return true
              }
            }
          }
        }

        return false
      },
    }
  },
})

export const WarningMessage = Node.create({
  name: "warningMessage",

  content: "block+",

  defining: true,

  selectable: false,

  parseHTML() {
    return [
      {
        tag: "div.warning-message",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ class: "warning-message" }, HTMLAttributes),
      0,
    ]
  },

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const { state } = editor
        const { $from } = state.selection

        // Найти родительский warning node
        let warningDepth = -1
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === "warning") {
            warningDepth = d
            break
          }
        }

        if (warningDepth === -1) return false

        // Проверить что мы в warningMessage
        for (let d = $from.depth; d > warningDepth; d--) {
          if ($from.node(d).type.name === "warningMessage") {
            // Найти позицию warningTitle и переместить в конец
            const warningNode = $from.node(warningDepth)
            let titleNode = null
            let titleOffset = -1
            
            warningNode.forEach((child, offset) => {
              if (child.type.name === "warningTitle" && titleOffset === -1) {
                titleNode = child
                titleOffset = offset
              }
            })

            if (titleNode && titleOffset >= 0) {
              const absolutePos = $from.start(warningDepth) + titleOffset + 1
              // Переместить в конец title
              const endPos = absolutePos + titleNode.content.size
              editor.commands.focus(endPos)
              return true
            }
          }
        }

        return false
      },
    }
  },
})

export default WarningNode
