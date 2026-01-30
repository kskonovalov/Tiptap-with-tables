import { mergeAttributes, Node } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { VideoNodeComponent } from "@/components/tiptap-node/video-node/video-node"

export interface VideoNodeOptions {
  /**
   * HTML attributes to add to the video element.
   * @default {}
   */
  HTMLAttributes: Record<string, any>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      /**
       * Set a video node
       */
      setVideo: (options?: { content?: string }) => ReturnType
      /**
       * Update video content
       */
      updateVideoContent: (content: string) => ReturnType
    }
  }
}

export const VideoNode = Node.create<VideoNodeOptions>({
  name: "video",

  group: "block",

  draggable: true,

  selectable: true,

  atom: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      content: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-content"),
        renderHTML: (attributes) => {
          if (!attributes.content) return {}
          return { "data-content": attributes.content }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="video"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { content } = HTMLAttributes

    return [
      "div",
      mergeAttributes(
        {
          "data-type": "video",
          class: "video-node-container",
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      // Render content as HTML
      content ? ["div", { innerHTML: content }] : ["div", {}, ""],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeComponent)
  },

  addCommands() {
    return {
      setVideo:
        (options = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              content: options.content || "",
            },
          })
        },
      updateVideoContent:
        (content: string) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state
          const node = selection.$from.node()

          if (node && node.type.name === this.name) {
            const pos = selection.$from.before()
            const newAttrs = {
              ...node.attrs,
              content: node.attrs.content + content, // Append to existing content
            }

            if (dispatch) {
              tr.setNodeMarkup(pos, undefined, newAttrs)
            }

            return true
          }

          return false
        },
    }
  },
})

export default VideoNode
