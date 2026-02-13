import {
  EditorJSBlock,
  EditorJSParagraphData,
  TipTapParagraphNode
} from '../types';
import { parseHTMLToTipTapNodes, convertTipTapNodesToHTML } from '../html-parser';

/**
 * Converts EditorJS paragraph block to TipTap paragraph node
 * Supports both 'paragraph' and 'customParagraph' block types
 * Parses HTML tags (bold, italic, links, etc.) from EditorJS text into TipTap marks
 *
 * @example
 * editorjsParagraphToTiptap({
 *   type: 'customParagraph',
 *   data: { text: 'Hello <b>world</b>!', alignment: 'center' }
 * })
 * // Returns: {
 * //   type: 'paragraph',
 * //   attrs: { textAlign: 'center' },
 * //   content: [
 * //     { type: 'text', text: 'Hello ' },
 * //     { type: 'text', text: 'world', marks: [{ type: 'bold' }] },
 * //     { type: 'text', text: '!' }
 * //   ]
 * // }
 *
 * @param block - EditorJS block
 * @returns TipTap paragraph node
 */
export function editorjsParagraphToTiptap(block: EditorJSBlock): TipTapParagraphNode {
  const data = block.data as EditorJSParagraphData;

  // Parse HTML text into TipTap text nodes with marks
  const content = parseHTMLToTipTapNodes(data.text || '');

  // Map alignment values — EditorJS stores alignment in tunes.alignmentTune.alignment
  let textAlign: 'left' | 'center' | 'right' | 'justify' | null = null;
  const tuneAlignment = block.tunes?.alignmentTune?.alignment;
  if (tuneAlignment) {
    textAlign = tuneAlignment;
  } else if (data.alignment) {
    textAlign = data.alignment;
  }

  const node: TipTapParagraphNode = {
    type: 'paragraph',
    attrs: {
      textAlign
    }
  };

  // Only add content if there are text nodes
  if (content.length > 0) {
    node.content = content;
  }

  return node;
}

/**
 * Converts TipTap paragraph node to EditorJS paragraph block
 * Converts TipTap marks back to HTML tags in the text
 *
 * @example
 * tiptapParagraphToEditorjs({
 *   type: 'paragraph',
 *   attrs: { textAlign: 'center' },
 *   content: [
 *     { type: 'text', text: 'Hello ' },
 *     { type: 'text', text: 'world', marks: [{ type: 'bold' }] }
 *   ]
 * }, 'customParagraph')
 * // Returns: {
 * //   type: 'customParagraph',
 * //   data: { text: 'Hello <b>world</b>', alignment: 'center' }
 * // }
 *
 * @param node - TipTap paragraph node
 * @param blockType - 'paragraph' or 'customParagraph' (defaults to 'paragraph')
 * @returns EditorJS block
 */
export function tiptapParagraphToEditorjs(
  node: TipTapParagraphNode,
  blockType: 'paragraph' | 'customParagraph' = 'paragraph'
): EditorJSBlock {
  // Convert TipTap text nodes with marks back to HTML
  const text = convertTipTapNodesToHTML(node.content || []);

  // Map alignment values
  let alignment: 'left' | 'center' | 'right' | 'justify' | undefined;
  if (node.attrs?.textAlign && node.attrs.textAlign !== 'left') {
    alignment = node.attrs.textAlign;
  }

  const data: EditorJSParagraphData = {
    text
  };

  const block: EditorJSBlock = {
    type: blockType,
    data
  };

  // Write alignment to tunes.alignmentTune.alignment
  if (alignment) {
    block.tunes = {
      alignmentTune: {
        alignment
      }
    };
  }

  return block;
}
