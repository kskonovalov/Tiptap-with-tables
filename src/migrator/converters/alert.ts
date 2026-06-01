import type { EditorJSBlock, TipTapNode, TipTapParagraphNode } from '../types';
import { parseHTMLToTipTapNodes, convertTipTapNodesToHTML } from '../html-parser';
import { generateBlockId } from '../utils';

/**
 * Converts EditorJS Alert block to TipTap alert node.
 * data.message (HTML) is parsed into paragraph children.
 * data.align maps to paragraph textAlign.
 * data.type maps to alert attrs.type.
 */
export function editorjsAlertToTiptap(block: EditorJSBlock): TipTapNode {
  const { message = '', align = null, type = 'primary' } = block.data;

  const content = parseHTMLToTipTapNodes(message || '');
  const paragraph: TipTapParagraphNode = {
    type: 'paragraph',
    attrs: { textAlign: align as any },
  };
  if (content.length > 0) {
    paragraph.content = content as TipTapParagraphNode['content'];
  }

  return {
    type: 'alert',
    attrs: { type },
    content: [paragraph],
  };
}

/**
 * Converts TipTap alert node to EditorJS Alert block.
 * Paragraph content is serialized back to HTML as data.message.
 * First paragraph's textAlign becomes data.align.
 */
export function tiptapAlertToEditorjs(node: TipTapNode): EditorJSBlock {
  const alertType = node.attrs?.type ?? 'primary';

  const paragraphs = (node.content ?? []).filter(
    (n): n is TipTapParagraphNode => n.type === 'paragraph',
  );

  const message = paragraphs
    .map((p) => convertTipTapNodesToHTML(p.content || []))
    .join('<br>');

  const align = paragraphs[0]?.attrs?.textAlign ?? null;

  return {
    id: generateBlockId(),
    type: 'Alert',
    data: {
      message,
      align,
      type: alertType,
    },
  };
}
