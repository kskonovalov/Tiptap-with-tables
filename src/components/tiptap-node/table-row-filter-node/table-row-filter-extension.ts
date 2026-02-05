import { TableRow } from "@tiptap/extension-table-row";

export const TableRowFilter = TableRow.extend({
  name: "tableRow",

  addAttributes() {
    return {
      ...this.parent?.(),
      hidden: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-hidden") === "true",
        renderHTML: (attributes) => {
          if (!attributes.hidden) return {};
          return { "data-hidden": "true" };
        },
      },
    };
  },
});
