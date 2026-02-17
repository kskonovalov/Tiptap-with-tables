import type { EditorJSBlock, TipTapNode } from '../types';
import { generateBlockId } from '../utils';

/**
 * Converts EditorJS Image block to TipTap image node
 */
export function editorjsImageToTiptap(block: EditorJSBlock): TipTapNode {
  const data = block.data;

  return {
    type: 'image',
    attrs: {
      src: data.file?.url || '',
      alt: data.caption || '',
      title: data.file?.title || '',
      width: null,
      height: null,
    },
  };
}

/**
 * Converts TipTap image node to EditorJS Image block
 */
export function tiptapImageToEditorjs(node: TipTapNode): EditorJSBlock {
  const attrs = node.attrs || {};

  return {
    id: generateBlockId(),
    type: 'image',
    data: {
      caption: attrs.alt || '',
      file: {
        extension: extractExtension(attrs.src || ''),
        id: null,
        size: 0,
        title: attrs.title || 'image',
        url: attrs.src || '',
      },
      stretched: false,
      withBackground: false,
      withBorder: false,
    },
  };
}

function extractExtension(url: string): string {
  const match = url.match(/\.(\w+)(?:\?|$)/);
  return match ? match[1] : '';
}
