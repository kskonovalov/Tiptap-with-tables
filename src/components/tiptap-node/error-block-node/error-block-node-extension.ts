import { mergeAttributes, Node } from "@tiptap/core"

export const ErrorBlockNode = Node.create({
  name: "errorBlock",

  group: "block",

  atom: true,

  addAttributes() {
    return {
      message: {
        default: "Unknown error",
        parseHTML: (element) => element.getAttribute("data-message") || "Unknown error",
        renderHTML: (attributes) => ({ "data-message": attributes.message }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-error-block="true"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-error-block": "true" }, HTMLAttributes),
      HTMLAttributes["data-message"] || "Unknown error",
    ]
  },
})

export default ErrorBlockNode
