import type {
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
import {
  editorjsDelimiterToTiptap,
  tiptapHorizontalRuleToEditorjs,
} from "./converters/delimiter";
import {
  editorjsImageToTiptap,
  tiptapImageToEditorjs,
} from "./converters/image";
import {
  editorjsTableToTiptap,
  tiptapTableToEditorjs,
} from "./converters/table";
import {
  editorjsFrameToTiptap,
  tiptapVideoToEditorjs,
} from "./converters/video";
import {
  editorjsRawToTiptap,
  editorjsCodeToolToTiptap,
  tiptapCodeBlockToEditorjs,
} from "./converters/code";
import {
  editorjsAttachesToTiptap,
  tiptapFileToEditorjs,
} from "./converters/attaches";
import {
  editorjsQuoteToTiptap,
  tiptapBlockquoteToEditorjs,
} from "./converters/quote";
import {
  editorjsToggleToTiptap,
  tiptapDetailsToEditorjs,
} from "./converters/toggle";
import {
  editorjsAlertToTiptap,
  tiptapAlertToEditorjs,
} from "./converters/alert";
import {
  editorjsWarningToTiptap,
  tiptapWarningToEditorjs,
} from "./converters/warning";
import {
  editorjsColumnsToTiptap,
  tiptapColumnsToEditorjs,
} from "./converters/columns";

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
/** Internal: converts a flat EditorJS blocks array to TipTap nodes. */
function convertBlocks(blocks: EditorJSBlock[]): TipTapNode[] {
  const content: TipTapNode[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockType = block.type.toLowerCase();
    if (block.type === "Toggle") {
      const count = block.data.items ?? 0;
      const contentBlocks = blocks.slice(i + 1, i + 1 + count);
      content.push(editorjsToggleToTiptap(block, contentBlocks));
      i += count;
    } else if (blockType === "paragraph" || blockType === "customparagraph") {
      content.push(editorjsParagraphToTiptap(block));
    } else if (blockType === "header") {
      content.push(editorjsHeaderToTiptap(block));
    } else if (blockType === "list") {
      content.push(editorjsListToTiptap(block));
    } else if (blockType === "delimiter") {
      content.push(editorjsDelimiterToTiptap(block));
    } else if (blockType === "image") {
      content.push(editorjsImageToTiptap(block));
    } else if (blockType === "table") {
      content.push(editorjsTableToTiptap(block));
    } else if (blockType === "frame") {
      content.push(editorjsFrameToTiptap(block));
    } else if (blockType === "raw") {
      content.push(editorjsRawToTiptap(block));
    } else if (blockType === "codetool") {
      content.push(editorjsCodeToolToTiptap(block));
    } else if (blockType === "attaches") {
      content.push(editorjsAttachesToTiptap(block));
    } else if (blockType === "quote") {
      content.push(editorjsQuoteToTiptap(block));
    } else if (blockType === "alert") {
      content.push(editorjsAlertToTiptap(block));
    } else if (blockType === "warning") {
      content.push(editorjsWarningToTiptap(block));
    } else if (blockType === "columns") {
      content.push(editorjsColumnsToTiptap(block, convertBlocks));
    }
    // Add more block type handlers here as needed
    else {
      console.warn(`Unsupported EditorJS block type: ${block.type}`);
    }
  }

  return content;
}

export function editorjsToTiptap(editorjsData: EditorJSData): TipTapDocument {
  return {
    type: "doc",
    content: convertBlocks(editorjsData.blocks),
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
/** Internal: converts a TipTap nodes array to a flat EditorJS blocks array. */
function convertNodes(
  nodes: TipTapNode[],
  paragraphBlockType: "paragraph" | "customParagraph" = "paragraph",
): EditorJSBlock[] {
  const blocks: EditorJSBlock[] = [];

  for (const node of nodes) {
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
    } else if (node.type === "horizontalRule") {
      blocks.push(tiptapHorizontalRuleToEditorjs(node));
    } else if (node.type === "image") {
      blocks.push(tiptapImageToEditorjs(node));
    } else if (node.type === "table") {
      blocks.push(tiptapTableToEditorjs(node as any));
    } else if (node.type === "video") {
      blocks.push(tiptapVideoToEditorjs(node));
    } else if (node.type === "codeBlock") {
      blocks.push(tiptapCodeBlockToEditorjs(node));
    } else if (node.type === "file") {
      blocks.push(tiptapFileToEditorjs(node));
    } else if (node.type === "blockquote") {
      blocks.push(tiptapBlockquoteToEditorjs(node));
    } else if (node.type === "details") {
      blocks.push(...tiptapDetailsToEditorjs(node));
    } else if (node.type === "alert") {
      blocks.push(tiptapAlertToEditorjs(node));
    } else if (node.type === "warning") {
      blocks.push(tiptapWarningToEditorjs(node));
    } else if (node.type === "columns") {
      blocks.push(tiptapColumnsToEditorjs(node, (inner) => convertNodes(inner, paragraphBlockType)));
    }
    // Add more node type handlers here as needed
    else {
      console.warn(`Unsupported TipTap node type: ${node.type}`);
    }
  }

  return blocks;
}

export function tiptapToEditorjs(
  tiptapDoc: TipTapDocument,
  options: {
    paragraphBlockType?: "paragraph" | "customParagraph";
  } = {},
): EditorJSData {
  const { paragraphBlockType = "paragraph" } = options;

  return {
    time: Date.now(),
    blocks: convertNodes(tiptapDoc.content, paragraphBlockType),
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
export {
  editorjsDelimiterToTiptap,
  tiptapHorizontalRuleToEditorjs,
} from "./converters/delimiter";
export {
  editorjsImageToTiptap,
  tiptapImageToEditorjs,
} from "./converters/image";
export {
  editorjsTableToTiptap,
  tiptapTableToEditorjs,
} from "./converters/table";
export {
  editorjsFrameToTiptap,
  tiptapVideoToEditorjs,
} from "./converters/video";
export {
  editorjsRawToTiptap,
  editorjsCodeToolToTiptap,
  tiptapCodeBlockToEditorjs,
} from "./converters/code";
export {
  editorjsAttachesToTiptap,
  tiptapFileToEditorjs,
} from "./converters/attaches";
export {
  editorjsQuoteToTiptap,
  tiptapBlockquoteToEditorjs,
} from "./converters/quote";
export {
  editorjsToggleToTiptap,
  tiptapDetailsToEditorjs,
} from "./converters/toggle";
export {
  editorjsAlertToTiptap,
  tiptapAlertToEditorjs,
} from "./converters/alert";
export {
  editorjsWarningToTiptap,
  tiptapWarningToEditorjs,
} from "./converters/warning";
export {
  editorjsColumnsToTiptap,
  tiptapColumnsToEditorjs,
} from "./converters/columns";
export { generateBlockId } from "./utils";
