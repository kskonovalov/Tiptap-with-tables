import { mergeAttributes } from "@tiptap/core"
import { TableRow } from "@tiptap/extension-table-row"

export const TableRowFilter = TableRow.extend({
  name: "tableRow",

  addAttributes() {
    return {
      ...this.parent?.(),
      hidden: {
        default: false,
        parseHTML: (element) => element.hasAttribute("data-hidden"),
        renderHTML: (attributes) => {
          if (!attributes.hidden) {
            return {}
          }
          return {
            "data-hidden": "true",
            class: "hidden",
          }
        },
      },
    }
  },
})
