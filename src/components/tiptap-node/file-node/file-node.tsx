"use client"

import type { NodeViewProps } from "@tiptap/react"
import { NodeViewWrapper } from "@tiptap/react"
import "@/components/tiptap-node/file-node/file-node.scss"

export const FileNodeComponent: React.FC<NodeViewProps> = (props) => {
  const { src, fileName, fileSize, mimeType } = props.node.attrs

  const formatSize = (bytes: number) => {
    if (!bytes) return ""
    const kb = bytes / 1024
    return kb < 1024
      ? `${kb.toFixed(2)} KB`
      : `${(kb / 1024).toFixed(2)} MB`
  }

  return (
    <NodeViewWrapper
      className="file-node-wrapper"
      data-drag-handle
      as="div"
    >
      <a
        href={src}
        download={fileName}
        target="_blank"
        rel="noopener noreferrer"
        className="file-link"
      >
        <span className="file-icon">📎</span>
        <div className="file-info">
          <span className="file-name">{fileName || "Download file"}</span>
          {(mimeType || fileSize) && (
            <span className="file-meta">
              {mimeType}
              {mimeType && fileSize && " • "}
              {fileSize && formatSize(fileSize)}
            </span>
          )}
        </div>
      </a>
    </NodeViewWrapper>
  )
}
