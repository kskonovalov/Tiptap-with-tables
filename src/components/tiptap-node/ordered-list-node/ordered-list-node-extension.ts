import { mergeAttributes, type CommandProps } from "@tiptap/core"
import { OrderedList } from "@tiptap/extension-list"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ListNodeViewComponent } from "../list-node/list-node-view"

export type OrderedListStyleType =
  | "list-decimal"
  | "list-lower-alpha"
  | "list-upper-alpha"
  | "list-lower-roman"
  | "list-upper-roman"

export const DEFAULT_ORDERED_STYLE: OrderedListStyleType = "list-decimal"

export const CustomOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(), // inherits 'start' attribute from base OrderedList
      listStyle: {
        default: DEFAULT_ORDERED_STYLE,
        parseHTML: (el) => el.getAttribute("data-list-style") || DEFAULT_ORDERED_STYLE,
        renderHTML: (attrs) => ({ "data-list-style": attrs.listStyle }),
      },
    }
  },

  addCommands() {
    return {
      ...this.parent?.(),
      toggleOrderedClass:
        (className: string) =>
        ({ commands, chain }: CommandProps) => {
          if (!this.editor.isActive(this.name)) {
            return chain()
              .toggleOrderedList()
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
