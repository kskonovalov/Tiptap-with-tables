import { mergeAttributes, Node } from "@tiptap/core"

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
      setVideo: (options: {
        src: string
        type?: string
      }) => ReturnType
    }
  }
}

export const VideoNode = Node.create<VideoNodeOptions>({
  name: "video",

  group: "block",

  draggable: true,

  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.querySelector("source")?.getAttribute("src"),
        renderHTML: (attributes) => {
          if (!attributes.src) return {}
          return {}
        },
      },
      type: {
        default: "video/mp4",
        parseHTML: (element) => element.querySelector("source")?.getAttribute("type"),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: "video",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(
        {
          controls: true,
          style: "max-width: 100%; border-radius: 0.375rem;",
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      ["source", { src: HTMLAttributes.src, type: HTMLAttributes.type }],
    ]
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})

export default VideoNode
