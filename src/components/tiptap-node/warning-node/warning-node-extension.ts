import { mergeAttributes, Node } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { WarningNodeComponent } from "./warning-node"
import type { Editor } from "@tiptap/core"

export interface WarningNodeOptions {
  HTMLAttributes: Record<string, any>
}

/**
 * Helper to navigate between warning title and message on Tab
 */
function handleWarningTabNavigation(
  editor: Editor,
  currentNodeName: "warningTitle" | "warningMessage",
  targetNodeName: "warningMessage" | "warningTitle"
): boolean {
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

  // Проверить что мы в currentNode
  for (let d = $from.depth; d > warningDepth; d--) {
    if ($from.node(d).type.name === currentNodeName) {
      // Найти targetNode
      const warningNode = $from.node(warningDepth)
      let targetNode = null
      let targetOffset = -1
      
      warningNode.forEach((child, offset) => {
        if (child.type.name === targetNodeName && targetOffset === -1) {
          targetNode = child
          targetOffset = offset
        }
      })

      if (targetNode && targetOffset >= 0) {
        const absolutePos = $from.start(warningDepth) + targetOffset + 1
        
        // Для warningMessage (block content) нужно найти конец последнего параграфа
        if (targetNodeName === "warningMessage") {
          const lastChild = targetNode.lastChild
          if (lastChild) {
            const endPos = absolutePos + targetNode.content.size - lastChild.nodeSize + lastChild.content.size
            editor.commands.focus(endPos)
            return true
          }
        } else {
          // Для warningTitle (inline content) просто конец контента
          const endPos = absolutePos + targetNode.content.size
          editor.commands.focus(endPos)
          return true
        }
      }
    }
  }

  return false
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    warning: {
      /**
       * Set a warning node
       */
      setWarning: () => ReturnType
      /**
       * Unset (unwrap) a warning node
       */
      unsetWarning: () => ReturnType
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
        ({ state, tr, dispatch }) => {
          const { $from, from, to } = state.selection

          // Check if cursor is inside a paragraph
          const currentNode = $from.node($from.depth)
          const isInParagraph = currentNode.type.name === 'paragraph'

          let titleContent: any = null
          let messageParagraphContent: any = null
          let replaceFrom: number
          let replaceTo: number

          if (isInParagraph) {
            const paraStart = $from.before($from.depth)
            const paraEnd = $from.after($from.depth)
            titleContent = currentNode.content
            replaceFrom = paraStart
            replaceTo = paraEnd

            // Check if the next sibling is also a paragraph — use it as the message
            const nextNode = tr.doc.nodeAt(paraEnd)
            if (nextNode && nextNode.type.name === 'paragraph') {
              messageParagraphContent = nextNode.content
              replaceTo = paraEnd + nextNode.nodeSize
            }
          } else {
            replaceFrom = from
            replaceTo = to
          }

          // Build title node
          const warningTitleNode = (titleContent && titleContent.size > 0)
            ? state.schema.nodes.warningTitle.create(null, titleContent)
            : state.schema.nodes.warningTitle.create()

          // Build message paragraph
          const messageParagraph = (messageParagraphContent && messageParagraphContent.size > 0)
            ? state.schema.nodes.paragraph.create(null, messageParagraphContent)
            : state.schema.nodes.paragraph.create()

          const warningMessageNode = state.schema.nodes.warningMessage.create(null, [messageParagraph])
          const warningNode = state.schema.nodes.warning.create(null, [warningTitleNode, warningMessageNode])

          tr.replaceRangeWith(replaceFrom, replaceTo, warningNode)

          // Place cursor inside warningTitle
          const titlePos = replaceFrom + 1
          const resolvedPos = tr.doc.resolve(titlePos)
          const selection = (state.selection.constructor as any).near(resolvedPos)
          tr.setSelection(selection)

          if (dispatch) {
            dispatch(tr)
          }

          return true
        },
      unsetWarning:
        () =>
        ({ state, chain }) => {
          const { selection, schema } = state
          const { $from } = selection

          // Find the parent warning node
          let warningPos = -1
          let warningNode = null
          for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type.name === "warning") {
              warningNode = $from.node(d)
              warningPos = $from.before(d)
              break
            }
          }

          if (!warningNode || warningPos === -1) return false

          const warningEnd = warningPos + warningNode.nodeSize

          // Collect content: title inline content as a paragraph + message blocks
          const content: any[] = []

          warningNode.forEach((child) => {
            if (child.type.name === "warningTitle") {
              const paragraph = schema.nodes.paragraph.create(null, child.content)
              content.push(paragraph)
            } else if (child.type.name === "warningMessage") {
              child.forEach((block) => content.push(block))
            }
          })

          if (!content.length) return false

          return chain()
            .insertContentAt(
              { from: warningPos, to: warningEnd },
              content.map((n) => n.toJSON())
            )
            .setTextSelection(warningPos + 1)
            .run()
        },
      toggleWarning:
        () =>
        ({ commands, editor }) => {
          if (editor.isActive("warning")) {
            return commands.unsetWarning()
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
      Tab: ({ editor }) => handleWarningTabNavigation(editor, "warningTitle", "warningMessage"),
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
      Tab: ({ editor }) => handleWarningTabNavigation(editor, "warningMessage", "warningTitle"),
    }
  },
})

export default WarningNode
