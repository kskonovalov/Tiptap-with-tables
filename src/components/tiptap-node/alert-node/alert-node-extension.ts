import { mergeAttributes, Node } from "@tiptap/core"

export type AlertType = "primary" | "secondary" | "info" | "success" | "warning" | "error"

export interface AlertNodeOptions {
  /**
   * HTML attributes to add to the alert element.
   * @default {}
   */
  HTMLAttributes: Record<string, any>
  /**
   * Available alert types
   * @default ["primary", "secondary", "info", "success", "warning", "error"]
   */
  types: AlertType[]
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    alert: {
      /**
       * Set alert node with specified type
       */
      setAlert: (options?: { type?: AlertType }) => ReturnType
      /**
       * Toggle alert node
       */
      toggleAlert: (options?: { type?: AlertType }) => ReturnType
      /**
       * Update alert type
       */
      updateAlertType: (type: AlertType) => ReturnType
      /**
       * Unset alert node
       */
      unsetAlert: () => ReturnType
    }
  }
}

export const AlertNode = Node.create<AlertNodeOptions>({
  name: "alert",

  group: "block",

  content: "block+",

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      types: ["primary", "secondary", "info", "success", "warning", "error"],
    }
  },

  addAttributes() {
    return {
      type: {
        default: "info",
        parseHTML: (element) => element.getAttribute("data-type") || "info",
        renderHTML: (attributes) => {
          return {
            "data-type": attributes.type,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-alert="true"]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        {
          "data-alert": "true",
          class: `alert alert-${node.attrs.type}`,
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0,
    ]
  },

  addCommands() {
    return {
      setAlert:
        (options) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, { type: options?.type || "info" })
        },
      toggleAlert:
        (options) =>
        ({ commands, editor }) => {
          const type = options?.type || "info"
          
          // Если alert уже активен
          if (editor.isActive(this.name)) {
            const currentType = editor.getAttributes(this.name).type
            
            // Если тип совпадает - удалить alert
            if (currentType === type) {
              return commands.lift(this.name)
            }
            
            // Если тип другой - обновить тип
            return commands.updateAttributes(this.name, { type })
          }
          
          // Если alert не активен - создать новый
          return commands.wrapIn(this.name, { type })
        },
      updateAlertType:
        (type) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { type })
        },
      unsetAlert:
        () =>
        ({ commands }) => {
          return commands.lift(this.name)
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-a": () => this.editor.commands.toggleAlert(),
    }
  },
})

export default AlertNode
