import { TaskList } from "@tiptap/extension-list"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ListNodeViewComponent } from "../list-node/list-node-view"

export const CustomTaskList = TaskList.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ListNodeViewComponent, {
      contentDOMElementTag: "ul",
    })
  },
})

export default CustomTaskList
