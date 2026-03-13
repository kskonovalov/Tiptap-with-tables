import type { EditorJSBlock, TipTapNode } from '../types';
import { generateBlockId } from '../utils';

/**
 * Converts EditorJS Columns block to TipTap columns node.
 *
 * Each col in data.cols becomes a columnItem. The col's inner blocks array is
 * converted via convertBlocks, which is supplied by the top-level dispatcher
 * in index.ts to avoid circular imports and to correctly handle multi-block
 * types like Toggle.
 */
export function editorjsColumnsToTiptap(
  block: EditorJSBlock,
  convertBlocks: (blocks: EditorJSBlock[]) => TipTapNode[],
): TipTapNode {
  const cols: Array<{ blocks: EditorJSBlock[] }> = block.data.cols ?? [];

  const columnItems: TipTapNode[] = cols.map((col) => {
    const content = convertBlocks(col.blocks ?? []);
    return {
      type: 'columnItem',
      content: content.length > 0 ? content : [{ type: 'paragraph' }],
    };
  });

  return {
    type: 'columns',
    attrs: { columns: columnItems.length },
    content: columnItems,
  };
}

/**
 * Converts TipTap columns node to EditorJS Columns block.
 *
 * Each columnItem's content nodes are converted via convertNodes, which is
 * supplied by the top-level dispatcher in index.ts.
 * convertNodes may return multiple EditorJS blocks per TipTap node (e.g. Toggle).
 */
export function tiptapColumnsToEditorjs(
  node: TipTapNode,
  convertNodes: (nodes: TipTapNode[]) => EditorJSBlock[],
): EditorJSBlock {
  const columnItems = (node.content ?? []).filter((n) => n.type === 'columnItem');

  const cols = columnItems.map((item) => ({
    time: Date.now(),
    blocks: convertNodes(item.content ?? []),
    version: '2.28.0',
  }));

  return {
    id: generateBlockId(),
    type: 'Columns',
    data: { cols },
  };
}
