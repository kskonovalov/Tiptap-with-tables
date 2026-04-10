"use client"

import React from "react"
import { NodeViewWrapper } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"

type State = { error: Error | null }

/**
 * HOC that wraps a TipTap NodeView component in a React Error Boundary.
 * If the component throws during render, shows an errorBlock placeholder
 * in edit mode (returns null in readonly mode) instead of crashing the editor.
 */
export function withErrorBlock<P extends NodeViewProps>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return class NodeViewErrorBoundary extends React.Component<P, State> {
    state: State = { error: null }

    static getDerivedStateFromError(error: Error): State {
      return { error }
    }

    componentDidCatch(error: Error) {
      console.error("[tiptap] node view render error:", error)
    }

    render() {
      if (this.state.error) {
        if (!this.props.editor.isEditable) return null
        return (
          <NodeViewWrapper data-error-block="true" contentEditable={false}>
            {this.state.error.message}
          </NodeViewWrapper>
        )
      }
      return <Component {...this.props} />
    }
  }
}
