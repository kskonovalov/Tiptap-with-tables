import type { EditorJSBlock, TipTapNode, TipTapParagraphNode } from '../types';
import { parseHTMLToTipTapNodes, convertTipTapNodesToHTML } from '../html-parser';
import { generateBlockId } from '../utils';

function makeParagraph(html: string, textAlign: string | null): TipTapParagraphNode {
  const content = parseHTMLToTipTapNodes(html || '');
  const node: TipTapParagraphNode = {
    type: 'paragraph',
    attrs: { textAlign: textAlign as any },
  };
  if (content.length > 0) {
    node.content = content;
  }
  return node;
}

/**
 * Converts EditorJS Quote block to TipTap blockquote node.
 * text and caption are mapped to separate paragraph children.
 */
export function editorjsQuoteToTiptap(block: EditorJSBlock): TipTapNode {
  const { text = '', caption = '', alignment = null } = block.data;

  const paragraphs: TipTapParagraphNode[] = [];

  paragraphs.push(makeParagraph(text, alignment));

  if (caption) {
    paragraphs.push(makeParagraph(caption, null));
  }

  return {
    type: 'blockquote',
    content: paragraphs,
  };
}

/**
 * Converts TipTap blockquote node to EditorJS Quote block.
 * All paragraph content is merged into data.text; caption is left empty.
 */
export function tiptapBlockquoteToEditorjs(node: TipTapNode): EditorJSBlock {
  const paragraphs = (node.content ?? []).filter(
    (n): n is TipTapParagraphNode => n.type === 'paragraph',
  );

  const textParagraphs = paragraphs.length >= 2 ? paragraphs.slice(0, -1) : paragraphs;
  const captionParagraph = paragraphs.length >= 2 ? paragraphs[paragraphs.length - 1] : null;

  const text = textParagraphs
    .map((p) => convertTipTapNodesToHTML(p.content || []))
    .join('\n');

  const caption = captionParagraph
    ? convertTipTapNodesToHTML(captionParagraph.content || [])
    : '';

  const alignment = paragraphs[0]?.attrs?.textAlign ?? null;

  return {
    id: generateBlockId(),
    type: 'Quote',
    data: {
      text,
      caption,
      alignment,
    },
  };
}
