import type { EditorJSBlock, TipTapNode } from '../types';
import { parseHTMLToTipTapNodes, convertTipTapNodesToHTML } from '../html-parser';
import { generateBlockId } from '../utils';

/**
 * Converts EditorJS Toggle block to TipTap details node.
 * data.text becomes the detailsSummary; detailsContent is left empty
 * because EditorJS only stores an item count, not the actual content.
 */
export function editorjsToggleToTiptap(block: EditorJSBlock): TipTapNode {
  const { text = '', status = 'closed' } = block.data;

  const summaryContent = parseHTMLToTipTapNodes(text);

  const summary: TipTapNode = {
    type: 'detailsSummary',
    content: summaryContent.length > 0 ? summaryContent : [],
  };

  const detailsContent: TipTapNode = {
    type: 'detailsContent',
    content: [],
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
 * Converts TipTap details node to EditorJS Toggle block.
 * detailsSummary text becomes data.text; paragraph count in detailsContent
 * becomes data.items; caption is not used by Toggle so fk is left empty.
 */
export function tiptapDetailsToEditorjs(node: TipTapNode): EditorJSBlock {
  const summary = node.content?.find((n) => n.type === 'detailsSummary');
  const detailsContent = node.content?.find((n) => n.type === 'detailsContent');

  const text = summary ? convertTipTapNodesToHTML(summary.content || []) : '';

  const items = (detailsContent?.content ?? []).filter(
    (n) => n.type === 'paragraph',
  ).length;

  return {
    id: generateBlockId(),
    type: 'Toggle',
    data: {
      fk: '',
      items,
      status: node.attrs?.open ? 'open' : 'closed',
      text,
    },
  };
}
