import { mergeAttributes, Node } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { VideoEmbedNodeComponent } from "@/components/tiptap-node/video-embed-node/video-embed-node"

export interface VideoEmbedNodeOptions {
  /**
   * HTML attributes to add to the video embed element.
   * @default {}
   */
  HTMLAttributes: Record<string, any>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoEmbed: {
      /**
       * Set a video embed node
       */
      setVideoEmbed: (options?: { content?: string }) => ReturnType
    }
  }
}

export const VideoEmbedNode = Node.create<VideoEmbedNodeOptions>({
  name: "videoEmbed",

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
        tag: 'div[data-type="video-embed"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { content } = HTMLAttributes

    return [
      "div",
      mergeAttributes(
        {
          "data-type": "video-embed",
          class: "video-embed-container",
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      content
        ? [
            "div",
            {
              style: "position: relative; width: 100%;",
              innerHTML: content,
            },
          ]
        : ["div", {}, ""],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoEmbedNodeComponent)
  },

  addCommands() {
    return {
      setVideoEmbed:
        (options = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              content: options.content || "",
            },
          })
        },
    }
  },
})

export default VideoEmbedNode
