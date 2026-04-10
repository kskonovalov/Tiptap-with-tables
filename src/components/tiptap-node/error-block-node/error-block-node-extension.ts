import { mergeAttributes, Node } from "@tiptap/react"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ErrorBlockNodeView } from "./error-block-node"

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

  addNodeView() {
    return ReactNodeViewRenderer(ErrorBlockNodeView)
  },
})

export default ErrorBlockNode
