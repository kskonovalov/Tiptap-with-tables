"use client"

import { useState, useCallback } from "react"
import type { NodeViewProps } from "@tiptap/react"
import { NodeViewWrapper } from "@tiptap/react"
import { Button } from "@/components/tiptap-ui-primitive/button"
import { ImagePlusIcon } from "@/components/tiptap-icons/image-plus-icon"
import "@/components/tiptap-node/video-node/video-node.scss"

export const VideoNodeComponent: React.FC<NodeViewProps> = (props) => {
  const { content } = props.node.attrs
  const [localContent, setLocalContent] = useState(content || "")
  const isEditable = props.editor.isEditable

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value
      setLocalContent(newContent)
      props.updateAttributes({ content: newContent })
    },
    [props]
  )

  const handleUploadClick = useCallback(() => {
    // Insert video-upload-node after this video node
    const pos = props.getPos()
    if (typeof pos === "number") {
      props.editor
        .chain()
        .focus()
        .insertContentAt(pos + props.node.nodeSize, {
          type: "videoUpload",
          attrs: {
            targetVideoNodePos: pos, // Pass position to upload node
          },
        })
        .run()
    }
  }, [props])

  if (!isEditable) {
    // Readonly mode: render content as HTML
    if (!content) {
      return (
        <NodeViewWrapper className="video-node-wrapper">
          <div className="video-node-empty">Нет видео</div>
        </NodeViewWrapper>
      )
    }

    return (
      <NodeViewWrapper className="video-node-wrapper">
        <div
          className="video-node-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </NodeViewWrapper>
    )
  }

  // Editable mode: textarea + upload button
  return (
    <NodeViewWrapper className="video-node-wrapper" data-drag-handle>
      <div className="video-node-editable">
        <textarea
          className="video-node-textarea"
          placeholder="Вставьте iframe код видео или загрузите файл"
          value={localContent}
          onChange={handleContentChange}
          rows={4}
        />

        <div className="video-node-actions">
          <Button
            type="button"
            data-style="ghost"
            onClick={handleUploadClick}
            className="video-node-upload-button"
          >
            <ImagePlusIcon className="tiptap-button-icon" />
            <span>Загрузить видео</span>
          </Button>
        </div>

        {/* Preview if there's content */}
        {localContent && (
          <div className="video-node-preview">
            <div className="video-node-preview-label">Предпросмотр:</div>
            <div
              className="video-node-preview-content"
              dangerouslySetInnerHTML={{ __html: localContent }}
            />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}
