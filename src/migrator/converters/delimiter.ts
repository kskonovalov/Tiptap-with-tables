import type { EditorJSBlock, TipTapNode } from '../types';
import { generateBlockId } from '../utils';

/**
 * Converts EditorJS delimiter block to TipTap horizontalRule node
 */
export function editorjsDelimiterToTiptap(_block: EditorJSBlock): TipTapNode {
  return {
    type: 'horizontalRule',
  };
}

/**
 * Converts TipTap horizontalRule node to EditorJS delimiter block
 */
export function tiptapHorizontalRuleToEditorjs(_node: TipTapNode): EditorJSBlock {
  return {
    id: generateBlockId(),
    type: 'delimiter',
    data: {},
  };
}
