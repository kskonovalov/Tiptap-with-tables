import { Extension } from "@tiptap/core"

export interface CopiedFormat {
  marks: Array<{ type: string; attrs: Record<string, unknown> }>
  nodeType: string
  nodeAttrs: Record<string, unknown>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    formatPainter: {
      copyFormat: () => ReturnType
      clearCopiedFormat: () => ReturnType
    }
  }
}

export const FormatPainter = Extension.create({
  name: "formatPainter",

  addStorage() {
    return {
      copiedFormat: null as CopiedFormat | null,
    }
  },

  addCommands() {
    return {
      copyFormat:
        () =>
        ({ editor, dispatch, tr }) => {
          const { selection, storedMarks } = editor.state
          const { $from } = selection

          const marks = (storedMarks ?? $from.marks()).map((mark) => ({
            type: mark.type.name,
            attrs: { ...mark.attrs },
          }))

          const node = $from.parent
          this.storage.copiedFormat = {
            marks,
            nodeType: node.type.name,
            nodeAttrs: { ...node.attrs },
          } satisfies CopiedFormat

          if (dispatch) dispatch(tr)
          return true
        },

      clearCopiedFormat:
        () =>
        ({ dispatch, tr }) => {
          this.storage.copiedFormat = null
          if (dispatch) dispatch(tr)
          return true
        },
    }
  },
})
