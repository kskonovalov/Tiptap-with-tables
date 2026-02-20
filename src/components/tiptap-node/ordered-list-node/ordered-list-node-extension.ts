import { mergeAttributes } from "@tiptap/core"
import { OrderedList } from "@tiptap/extension-list"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ListNodeViewComponent } from "../list-node/list-node-view"

export type OrderedListStyleType =
  | "decimal"
  | "lower-alpha"
  | "upper-alpha"
  | "lower-roman"
  | "upper-roman"

export const CustomOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(), // inherits 'start' attribute from base OrderedList
      listStyleType: {
        default: "decimal",
        parseHTML: (el) =>
          el.style.listStyleType ||
          el.getAttribute("data-list-style") ||
          "decimal",
        renderHTML: (attrs) =>
          attrs.listStyleType && attrs.listStyleType !== "decimal"
            ? {
                "data-list-style": attrs.listStyleType,
                style: `list-style-type: ${attrs.listStyleType}`,
              }
            : {},
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "ol",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ListNodeViewComponent, {
      contentDOMElementTag: "ol",
    })
  },
})

export default CustomOrderedList
