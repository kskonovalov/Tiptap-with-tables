import type { EditorJSBlock, TipTapNode, TipTapParagraphNode } from '../types';
import { parseHTMLToTipTapNodes, convertTipTapNodesToHTML } from '../html-parser';
import { generateBlockId } from '../utils';
import { editorjsParagraphToTiptap, tiptapParagraphToEditorjs } from './paragraph';

/**
 * Converts EditorJS Toggle block to TipTap details node.
 * data.text becomes the detailsSummary; contentBlocks (the next data.items
 * blocks from the flat EditorJS array) become paragraphs inside detailsContent.
 */
export function editorjsToggleToTiptap(
  block: EditorJSBlock,
  contentBlocks: EditorJSBlock[] = [],
): TipTapNode {
  const { text = '', status = 'closed' } = block.data;

  const summaryContent = parseHTMLToTipTapNodes(text);

  const summary: TipTapNode = {
    type: 'detailsSummary',
    content: summaryContent.length > 0 ? summaryContent : [],
  };

  const contentNodes: TipTapParagraphNode[] = contentBlocks.map((b) => {
    const bt = b.type.toLowerCase();
    if (bt === 'paragraph' || bt === 'customparagraph') {
      return editorjsParagraphToTiptap(b);
    }
    // Fallback: empty paragraph for unrecognised block types
    return { type: 'paragraph', attrs: { textAlign: null } };
  });

  const detailsContent: TipTapNode = {
    type: 'detailsContent',
    content: contentNodes,
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
 * content as flat paragraph blocks (matching the EditorJS flat-array format).
 */
export function tiptapDetailsToEditorjs(node: TipTapNode): EditorJSBlock[] {
  const summary = node.content?.find((n) => n.type === 'detailsSummary');
  const detailsContent = node.content?.find((n) => n.type === 'detailsContent');

  const text = summary ? convertTipTapNodesToHTML(summary.content || []) : '';

  const contentParagraphs = (detailsContent?.content ?? []).filter(
    (n): n is TipTapParagraphNode => n.type === 'paragraph',
  );

  const toggleBlock: EditorJSBlock = {
    id: generateBlockId(),
    type: 'Toggle',
    data: {
      fk: '',
      items: contentParagraphs.length,
      status: node.attrs?.open ? 'open' : 'closed',
      text,
    },
  };

  const contentBlocks = contentParagraphs.map((p) =>
    tiptapParagraphToEditorjs(p, 'paragraph'),
  );

  return [toggleBlock, ...contentBlocks];
}
