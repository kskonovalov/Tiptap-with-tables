import { mergeAttributes, type CommandProps } from "@tiptap/core"
import { BulletList } from "@tiptap/extension-list"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ListNodeViewComponent } from "../list-node/list-node-view"

export type BulletListStyleType = "list-disc" | "list-check" | "list-plus"
export type ListAlignType = "left" | "center" | "right"

export const DEFAULT_BULLET_STYLE: BulletListStyleType = "list-disc"

export const CustomBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyle: {
        default: DEFAULT_BULLET_STYLE,
        parseHTML: (el) => el.getAttribute("data-list-style") || DEFAULT_BULLET_STYLE,
        renderHTML: (attrs) => ({ "data-list-style": attrs.listStyle }),
      },
      listAlign: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-list-align") || null,
        renderHTML: (attrs) => attrs.listAlign ? { "data-list-align": attrs.listAlign } : {},
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
              .updateAttributes(this.name, { listStyle: className })
              .run()
          }
          if (!this.editor.isActive(this.name, { listStyle: className })) {
            return commands.updateAttributes(this.name, { listStyle: className })
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
