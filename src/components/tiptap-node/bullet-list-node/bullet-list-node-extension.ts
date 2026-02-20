import { mergeAttributes, type CommandProps } from "@tiptap/core"
import { BulletList } from "@tiptap/extension-list"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ListNodeViewComponent } from "../list-node/list-node-view"

export type BulletListStyleType = "list-disc" | "list-check" | "list-plus"

export const CustomBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: "list-disc",
        parseHTML: (el) => el.getAttribute("class") || "list-disc",
        renderHTML: (attrs) => ({ class: attrs.class }),
      },
    }
  },

  addCommands() {
    return {
      ...this.parent?.(),
      toggleBulletClass:
        (className: string) =>
        ({ commands, chain }: CommandProps) => {
          if (!this.editor.isActive(this.name)) {
            return chain()
              .toggleBulletList()
              .updateAttributes(this.name, { class: className })
              .run()
          }
          if (!this.editor.isActive(this.name, { class: className })) {
            return commands.updateAttributes(this.name, { class: className })
          }
          return true
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
