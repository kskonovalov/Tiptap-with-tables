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
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            content: [
              {
                type: "warningTitle",
                content: [{ type: "text", text: "Заголовок" }],
              },
              {
                type: "warningMessage",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Сообщение" }],
                  },
                ],
              },
            ],
          })
        },
      toggleWarning:
        () =>
        ({ commands, editor }) => {
          if (editor.isActive(this.name)) {
            // TODO: implement unwrap logic if needed
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
})

export default WarningNode
