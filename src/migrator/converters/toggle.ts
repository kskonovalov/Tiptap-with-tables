import type { EditorJSBlock, TipTapNode } from '../types';
import { parseHTMLToTipTapNodes, convertTipTapNodesToHTML } from '../html-parser';
import { generateBlockId } from '../utils';

/**
 * Converts EditorJS Toggle block to TipTap details node.
 * data.text becomes the detailsSummary; contentBlocks (the next data.items
 * blocks from the flat EditorJS array) become the content inside detailsContent.
 * Supports any block type via the injected convertBlocks dispatcher.
 */
export function editorjsToggleToTiptap(
  block: EditorJSBlock,
  contentBlocks: EditorJSBlock[] = [],
  convertBlocks: (blocks: EditorJSBlock[]) => TipTapNode[],
): TipTapNode {
  const { text = '', status = 'closed' } = block.data;

  const summaryContent = parseHTMLToTipTapNodes(text);

  const summary: TipTapNode = {
    type: 'detailsSummary',
    content: summaryContent.length > 0 ? summaryContent : [],
  };

  const contentNodes = convertBlocks(contentBlocks);

  const detailsContent: TipTapNode = {
    type: 'detailsContent',
    content: contentNodes.length > 0 ? contentNodes : [{ type: 'paragraph' }],
  };

  return {
    type: 'details',
    attrs: {
      open: status === 'open',
    },
    content: [summary, detailsContent],
  };
}

/**
 * Converts TipTap details node to an EditorJS Toggle block followed by its
 * content as flat EditorJS blocks (matching the EditorJS flat-array format).
 * Supports any node type via the injected convertNodes dispatcher.
 */
export function tiptapDetailsToEditorjs(
  node: TipTapNode,
  convertNodes: (nodes: TipTapNode[]) => EditorJSBlock[],
): EditorJSBlock[] {
  const summary = node.content?.find((n) => n.type === 'detailsSummary') as TipTapNode | undefined;
  const detailsContent = node.content?.find((n) => n.type === 'detailsContent') as TipTapNode | undefined;

  const text = summary ? convertTipTapNodesToHTML(summary.content || []) : '';

  const innerNodes = (detailsContent?.content ?? []) as TipTapNode[];
  const contentBlocks = convertNodes(innerNodes);

  const toggleBlock: EditorJSBlock = {
    id: generateBlockId(),
    type: 'Toggle',
    data: {
      fk: '',
      items: contentBlocks.length,
      status: node.attrs?.open ? 'open' : 'closed',
      text,
    },
  };

  return [toggleBlock, ...contentBlocks];
}
