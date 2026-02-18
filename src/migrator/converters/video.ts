import type { EditorJSBlock, TipTapNode } from '../types';
import { generateBlockId } from '../utils';

/**
 * Converts EditorJS Frame block to TipTap video node
 */
export function editorjsFrameToTiptap(block: EditorJSBlock): TipTapNode {
  return {
    type: 'video',
    attrs: {
      content: block.data.frameStr || '',
    },
  };
}

/**
 * Converts TipTap video node to EditorJS Frame block
 */
export function tiptapVideoToEditorjs(node: TipTapNode): EditorJSBlock {
  return {
    id: generateBlockId(),
    type: 'Frame',
    data: {
      frameStr: node.attrs?.content || '',
    },
  };
}
