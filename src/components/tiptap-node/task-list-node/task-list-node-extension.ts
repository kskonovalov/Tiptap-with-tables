import { TaskList } from "@tiptap/extension-list"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ListNodeViewComponent } from "../list-node/list-node-view"
import { withErrorBlock } from "../with-error-block"

export const CustomTaskList = TaskList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listAlign: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-list-align") || null,
        renderHTML: (attrs) => attrs.listAlign ? { "data-list-align": attrs.listAlign } : {},
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(withErrorBlock(ListNodeViewComponent), {
      contentDOMElementTag: "ul",
    })
  },
})

export default CustomTaskList
