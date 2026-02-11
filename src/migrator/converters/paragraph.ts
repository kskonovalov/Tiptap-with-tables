import {
  EditorJSBlock,
  EditorJSParagraphData,
  TipTapParagraphNode,
  TipTapTextNode
} from '../types';

/**
 * Converts EditorJS paragraph block to TipTap paragraph node
 * Supports both 'paragraph' and 'customParagraph' block types
 *
 * @param block - EditorJS block
 * @returns TipTap paragraph node
 */
export function editorjsParagraphToTiptap(block: EditorJSBlock): TipTapParagraphNode {
  const data = block.data as EditorJSParagraphData;

  // Create a simple text node from the text
  const content: TipTapTextNode[] = [];
  if (data.text) {
    content.push({
      type: 'text',
      text: data.text
    });
  }

  // Map alignment values
  let textAlign: 'left' | 'center' | 'right' | 'justify' | null = null;
  if (data.alignment) {
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
 *
 * @param node - TipTap paragraph node
 * @param blockType - 'paragraph' or 'customParagraph' (defaults to 'paragraph')
 * @returns EditorJS block
 */
export function tiptapParagraphToEditorjs(
  node: TipTapParagraphNode,
  blockType: 'paragraph' | 'customParagraph' = 'paragraph'
): EditorJSBlock {
  // Extract text from all text nodes
  const text = (node.content || [])
    .map(textNode => textNode.text || '')
    .join('');

  // Map alignment values
  let alignment: 'left' | 'center' | 'right' | 'justify' | undefined;
  if (node.attrs?.textAlign && node.attrs.textAlign !== 'left') {
    alignment = node.attrs.textAlign;
  }

  const data: EditorJSParagraphData = {
    text
  };

  // Only add alignment if it's not the default (left or null)
  if (alignment) {
    data.alignment = alignment;
  }

  return {
    type: blockType,
    data
  };
}
