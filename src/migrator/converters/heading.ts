import {
  EditorJSBlock,
  EditorJSHeaderData,
  TipTapHeadingNode
} from '../types';
import { parseHTMLToTipTapNodes, convertTipTapNodesToHTML } from '../html-parser';

/**
 * Converts EditorJS header block to TipTap heading node
 * Parses HTML tags (bold, italic, links, etc.) from EditorJS text into TipTap marks
 *
 * @example
 * editorjsHeaderToTiptap({
 *   type: 'header',
 *   data: { text: 'Hello <b>world</b>!', level: 2, alignment: 'center' }
 * })
 * // Returns: {
 * //   type: 'heading',
 * //   attrs: { level: 2, textAlign: 'center' },
 * //   content: [
 * //     { type: 'text', text: 'Hello ' },
 * //     { type: 'text', text: 'world', marks: [{ type: 'bold' }] },
 * //     { type: 'text', text: '!' }
 * //   ]
 * // }
 *
 * @param block - EditorJS block with type 'header'
 * @returns TipTap heading node
 */
export function editorjsHeaderToTiptap(block: EditorJSBlock): TipTapHeadingNode {
  const data = block.data as EditorJSHeaderData;

  const content = parseHTMLToTipTapNodes(data.text || '');

  const level = (data.level >= 1 && data.level <= 6 ? data.level : 2) as 1 | 2 | 3 | 4 | 5 | 6;

  // EditorJS stores alignment in tunes.alignmentTune.alignment
  let textAlign: 'left' | 'center' | 'right' | 'justify' | null = null;
  const tuneAlignment = block.tunes?.alignmentTune?.alignment;
  if (tuneAlignment) {
    textAlign = tuneAlignment;
  } else if (data.alignment) {
    textAlign = data.alignment;
  }

  const node: TipTapHeadingNode = {
    type: 'heading',
    attrs: {
      level,
      textAlign,
    },
  };

  if (content.length > 0) {
    node.content = content;
  }

  return node;
}

/**
 * Converts TipTap heading node to EditorJS header block
 * Converts TipTap marks back to HTML tags in the text
 *
 * @example
 * tiptapHeadingToEditorjs({
 *   type: 'heading',
 *   attrs: { level: 2, textAlign: 'center' },
 *   content: [
 *     { type: 'text', text: 'Hello ' },
 *     { type: 'text', text: 'world', marks: [{ type: 'bold' }] }
 *   ]
 * })
 * // Returns: {
 * //   type: 'header',
 * //   data: { text: 'Hello <b>world</b>', level: 2, alignment: 'center' }
 * // }
 *
 * @param node - TipTap heading node
 * @returns EditorJS block with type 'header'
 */
export function tiptapHeadingToEditorjs(node: TipTapHeadingNode): EditorJSBlock {
  const text = convertTipTapNodesToHTML(node.content || []);

  const level = node.attrs?.level || 2;

  let alignment: 'left' | 'center' | 'right' | 'justify' | undefined;
  if (node.attrs?.textAlign && node.attrs.textAlign !== 'left') {
    alignment = node.attrs.textAlign;
  }

  const data: EditorJSHeaderData = {
    text,
    level: level as 1 | 2 | 3 | 4 | 5 | 6,
  };

  const block: EditorJSBlock = {
    type: 'header',
    data,
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
