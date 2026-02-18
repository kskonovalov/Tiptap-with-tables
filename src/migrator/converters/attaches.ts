import type { EditorJSBlock, TipTapNode } from '../types';
import { generateBlockId } from '../utils';

/**
 * Converts EditorJS Attaches block to TipTap file node
 */
export function editorjsAttachesToTiptap(block: EditorJSBlock): TipTapNode {
  const file = block.data.file || {};

  return {
    type: 'file',
    attrs: {
      extension: file.extension || '',
      id: file.id || null,
      size: file.size ?? 0,
      title: file.title || block.data.title || '',
      url: file.url || '',
    },
  };
}

/**
 * Converts TipTap file node to EditorJS Attaches block
 */
export function tiptapFileToEditorjs(node: TipTapNode): EditorJSBlock {
  const attrs = node.attrs || {};

  return {
    id: generateBlockId(),
    type: 'Attaches',
    data: {
      file: {
        extension: attrs.extension || '',
        id: attrs.id || null,
        size: attrs.size ?? 0,
        title: attrs.title || '',
        url: attrs.url || '',
      },
      title: attrs.title || '',
    },
  };
}
