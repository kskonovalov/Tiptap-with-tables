import type { EditorJSBlock, TipTapNode, TipTapParagraphNode } from '../types';
import { parseHTMLToTipTapNodes, convertTipTapNodesToHTML } from '../html-parser';
import { generateBlockId } from '../utils';

/**
 * Converts EditorJS Warning block to TipTap warning node.
 * data.title (HTML) becomes warningTitle content (inline text nodes).
 * data.message (HTML) becomes a paragraph inside warningMessage.
 */
export function editorjsWarningToTiptap(block: EditorJSBlock): TipTapNode {
  const { title = '', message = '' } = block.data;

  const titleContent = parseHTMLToTipTapNodes(title || '');
  const warningTitle: TipTapNode = { type: 'warningTitle', content: titleContent as TipTapNode['content'] };

  const messageContent = parseHTMLToTipTapNodes(message || '');
  const messageParagraph: TipTapParagraphNode = { type: 'paragraph' };
  if (messageContent.length > 0) {
    messageParagraph.content = messageContent as TipTapParagraphNode['content'];
  }
  const warningMessage: TipTapNode = { type: 'warningMessage', content: [messageParagraph] };

  return {
    type: 'warning',
    content: [warningTitle, warningMessage],
  };
}

/**
 * Converts TipTap warning node to EditorJS Warning block.
 * warningTitle content is serialized to HTML as data.title.
 * warningMessage paragraphs are serialized to HTML as data.message.
 */
export function tiptapWarningToEditorjs(node: TipTapNode): EditorJSBlock {
  const titleNode = (node.content ?? []).find((n) => n.type === 'warningTitle') as TipTapNode | undefined;
  const messageNode = (node.content ?? []).find((n) => n.type === 'warningMessage') as TipTapNode | undefined;

  const title = convertTipTapNodesToHTML(titleNode?.content || []);

  const paragraphs = (messageNode?.content ?? []).filter(
    (n): n is TipTapParagraphNode => n.type === 'paragraph',
  );
  const message = paragraphs
    .map((p) => convertTipTapNodesToHTML(p.content || []))
    .join('\n');

  return {
    id: generateBlockId(),
    type: 'Warning',
    data: {
      title,
      message,
    },
  };
}
