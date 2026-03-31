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
      originalIndex: {
        default: null,
        parseHTML: (element) => {
          const v = element.getAttribute("data-original-index");
          return v !== null ? Number(v) : null;
        },
        renderHTML: (attributes) => {
          if (attributes.originalIndex === null || attributes.originalIndex === undefined) return {};
          return { "data-original-index": String(attributes.originalIndex) };
        },
      },
    };
  },
});
