import type { EditorJSBlock, TipTapNode } from '../types';
import { generateBlockId } from '../utils';

function toCodeBlock(text: string): TipTapNode {
  return {
    type: 'codeBlock',
    attrs: { language: null },
    content: text ? [{ type: 'text', text }] : [],
  };
}

/**
 * Converts EditorJS Raw block to TipTap codeBlock node
 */
export function editorjsRawToTiptap(block: EditorJSBlock): TipTapNode {
  return toCodeBlock(block.data.html || '');
}

/**
 * Converts EditorJS CodeTool block to TipTap codeBlock node
 */
export function editorjsCodeToolToTiptap(block: EditorJSBlock): TipTapNode {
  return toCodeBlock(block.data.code || '');
}

/**
 * Converts TipTap codeBlock node to EditorJS Raw block
 */
export function tiptapCodeBlockToEditorjs(node: TipTapNode): EditorJSBlock {
  const text = (node.content ?? [])
    .map((n) => {
      if (n.type === 'hardBreak') return '\n';
      return ('text' in n ? n.text : '') ?? '';
    })
    .join('');

  return {
    id: generateBlockId(),
    type: 'Raw',
    data: {
      html: text,
    },
  };
}
