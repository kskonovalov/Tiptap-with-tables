import { mergeAttributes, Node } from "@tiptap/react"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ERROR_MESSAGES } from "../../../lib/error-messages"
import { ErrorBlockNodeView } from "./error-block-node"

export const ErrorBlockNode = Node.create({
  name: "errorBlock",

  group: "block",

  atom: true,

  addAttributes() {
    return {
      message: {
        default: ERROR_MESSAGES.UNKNOWN,
        parseHTML: (element) => element.getAttribute("data-message") || ERROR_MESSAGES.UNKNOWN,
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
      mergeAttributes({ "data-error-block": "true", class: "errorBlock" }, HTMLAttributes),
      HTMLAttributes["data-message"] || ERROR_MESSAGES.UNKNOWN,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ErrorBlockNodeView)
  },
})

export default ErrorBlockNode
