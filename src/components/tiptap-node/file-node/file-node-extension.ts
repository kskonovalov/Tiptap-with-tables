import { mergeAttributes, Node } from "@tiptap/core"

export interface FileNodeOptions {
  /**
   * HTML attributes to add to the file element.
   * @default {}
   */
  HTMLAttributes: Record<string, any>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    file: {
      /**
       * Set a file node
       */
      setFile: (options: {
        src: string
        fileName?: string
        fileSize?: number
        mimeType?: string
      }) => ReturnType
    }
  }
}

export const FileNode = Node.create<FileNodeOptions>({
  name: "file",

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
        parseHTML: (element) => element.getAttribute("href"),
        renderHTML: (attributes) => {
          if (!attributes.src) return {}
          return { href: attributes.src }
        },
      },
      fileName: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-file-name"),
        renderHTML: (attributes) => {
          if (!attributes.fileName) return {}
          return { "data-file-name": attributes.fileName }
        },
      },
      fileSize: {
        default: null,
        parseHTML: (element) => {
          const size = element.getAttribute("data-file-size")
          return size ? parseInt(size, 10) : null
        },
        renderHTML: (attributes) => {
          if (!attributes.fileSize) return {}
          return { "data-file-size": attributes.fileSize }
        },
      },
      mimeType: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-mime-type"),
        renderHTML: (attributes) => {
          if (!attributes.mimeType) return {}
          return { "data-mime-type": attributes.mimeType }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-type="file"][href]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { fileName, mimeType } = HTMLAttributes
    const displayName = fileName || "Download file"
    const displayType = mimeType ? ` (${mimeType})` : ""

    return [
      "a",
      mergeAttributes(
        {
          "data-type": "file",
          download: fileName,
          target: "_blank",
          rel: "noopener noreferrer",
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      `📎 ${displayName}${displayType}`,
    ]
  },

  addCommands() {
    return {
      setFile:
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

export default FileNode
