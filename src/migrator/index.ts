import {
  EditorJSData,
  EditorJSBlock,
  TipTapDocument,
  TipTapNode,
} from "./types";
import {
  editorjsParagraphToTiptap,
  tiptapParagraphToEditorjs,
} from "./converters/paragraph";
import {
  editorjsHeaderToTiptap,
  tiptapHeadingToEditorjs,
} from "./converters/heading";
import {
  editorjsListToTiptap,
  tiptapListToEditorjs,
} from "./converters/list";

/**
 * Converts EditorJS data to TipTap document format
 * Parses HTML formatting from EditorJS (bold, italic, links, etc.) into TipTap marks
 *
 * Supported block types:
 * - paragraph / customParagraph: Converts to TipTap paragraph with alignment and text formatting
 *
 * @example
 * const editorjsData = {
 *   blocks: [
 *     {
 *       type: 'customParagraph',
 *       data: {
 *         text: 'Hello <b>world</b> with <i>formatting</i>!',
 *         alignment: 'center'
 *       }
 *     }
 *   ]
 * };
 *
 * const tiptapDoc = editorjsToTiptap(editorjsData);
 * // Returns TipTap document with properly structured marks
 *
 * @param editorjsData - EditorJS data object
 * @returns TipTap document
 */
export function editorjsToTiptap(editorjsData: EditorJSData): TipTapDocument {
  const content: TipTapNode[] = [];

  for (const block of editorjsData.blocks) {
    // Handle paragraph and customParagraph blocks
    if (block.type === "paragraph" || block.type === "customParagraph") {
      content.push(editorjsParagraphToTiptap(block));
    } else if (block.type === "header") {
      content.push(editorjsHeaderToTiptap(block));
    } else if (block.type === "list") {
      content.push(editorjsListToTiptap(block));
    }
    // Add more block type handlers here as needed
    else {
      console.warn(`Unsupported EditorJS block type: ${block.type}`);
      // Optionally convert unknown blocks to paragraphs or skip them
    }
  }

  return {
    type: "doc",
    content,
  };
}

/**
 * Converts TipTap document to EditorJS data format
 * Converts TipTap marks back to HTML tags in EditorJS text fields
 *
 * Supported node types:
 * - paragraph: Converts to EditorJS paragraph block with alignment and HTML formatting
 *
 * @example
 * const tiptapDoc = {
 *   type: 'doc',
 *   content: [
 *     {
 *       type: 'paragraph',
 *       attrs: { textAlign: 'center' },
 *       content: [{ type: 'text', text: 'Hello World' }]
 *     }
 *   ]
 * };
 *
 * const editorjsData = tiptapToEditorjs(tiptapDoc, { paragraphBlockType: 'customParagraph' });
 * // Returns: { blocks: [{ type: 'customParagraph', data: { text: 'Hello World', alignment: 'center' } }] }
 *
 * @param tiptapDoc - TipTap document
 * @param options - Conversion options
 * @param options.paragraphBlockType - Use 'paragraph' or 'customParagraph' for paragraph blocks (default: 'paragraph')
 * @returns EditorJS data object
 */
export function tiptapToEditorjs(
  tiptapDoc: TipTapDocument,
  options: {
    paragraphBlockType?: "paragraph" | "customParagraph";
  } = {},
): EditorJSData {
  const { paragraphBlockType = "paragraph" } = options;

  const blocks: EditorJSBlock[] = [];

  for (const node of tiptapDoc.content) {
    // Handle paragraph nodes
    if (node.type === "paragraph") {
      blocks.push(tiptapParagraphToEditorjs(node, paragraphBlockType));
    } else if (node.type === "heading") {
      blocks.push(tiptapHeadingToEditorjs(node as any));
    } else if (
      node.type === "bulletList" ||
      node.type === "orderedList" ||
      node.type === "taskList"
    ) {
      blocks.push(tiptapListToEditorjs(node));
    }
    // Add more node type handlers here as needed
    else {
      console.warn(`Unsupported TipTap node type: ${node.type}`);
      // Optionally convert unknown nodes or skip them
    }
  }

  return {
    time: Date.now(),
    blocks,
    version: "2.28.0",
  };
}

// Re-export types for convenience
export * from "./types";

// Re-export specific converters for advanced usage
export {
  editorjsParagraphToTiptap,
  tiptapParagraphToEditorjs,
} from "./converters/paragraph";
export {
  editorjsHeaderToTiptap,
  tiptapHeadingToEditorjs,
} from "./converters/heading";
export {
  editorjsListToTiptap,
  tiptapListToEditorjs,
} from "./converters/list";
