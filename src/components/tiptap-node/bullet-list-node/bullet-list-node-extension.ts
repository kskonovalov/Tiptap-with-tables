import { mergeAttributes } from "@tiptap/core"
import { BulletList } from "@tiptap/extension-list"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ListNodeViewComponent } from "../list-node/list-node-view"

export type BulletListStyleType = "disc" | "check" | "plus"

export const CustomBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyleType: {
        default: "disc",
        parseHTML: (el) => el.getAttribute("data-bullet-style") || "disc",
        renderHTML: (attrs) =>
          attrs.listStyleType && attrs.listStyleType !== "disc"
            ? { "data-bullet-style": attrs.listStyleType }
            : {},
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "ul",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ListNodeViewComponent, {
      contentDOMElementTag: "ul",
    })
  },
})

export default CustomBulletList
