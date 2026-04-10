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
/** Returns an errorBlock node when a converter throws. */
function errorBlock(block: EditorJSBlock, err: unknown): TipTapNode {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Migration failed for block type "${block.type}":`, err);
  return { type: "errorBlock", attrs: { message: `[${block.type}] ${message}` } };
}

/** Internal: converts a flat EditorJS blocks array to TipTap nodes. */
function convertBlocks(blocks: EditorJSBlock[]): TipTapNode[] {
  const content: TipTapNode[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockType = block.type.toLowerCase();
    if (block.type === "Toggle") {
      const count = block.data.items ?? 0;
      const contentBlocks = blocks.slice(i + 1, i + 1 + count);
      try { content.push(editorjsToggleToTiptap(block, contentBlocks)); }
      catch (err) { content.push(errorBlock(block, err)); }
      i += count;
    } else if (blockType === "paragraph" || blockType === "customparagraph") {
      try { content.push(editorjsParagraphToTiptap(block)); }
      catch (err) { content.push(errorBlock(block, err)); }
    } else if (blockType === "header") {
      try { content.push(editorjsHeaderToTiptap(block)); }
      catch (err) { content.push(errorBlock(block, err)); }
    } else if (blockType === "list") {
      try { content.push(editorjsListToTiptap(block)); }
      catch (err) { content.push(errorBlock(block, err)); }
    } else if (blockType === "delimiter") {
      try { content.push(editorjsDelimiterToTiptap(block)); }
      catch (err) { content.push(errorBlock(block, err)); }
    } else if (blockType === "image") {
      try { content.push(editorjsImageToTiptap(block)); }
      catch (err) { content.push(errorBlock(block, err)); }
    } else if (blockType === "table") {
      try { content.push(editorjsTableToTiptap(block)); }
      catch (err) { content.push(errorBlock(block, err)); }
    } else if (blockType === "frame") {
      try { content.push(editorjsFrameToTiptap(block)); }
      catch (err) { content.push(errorBlock(block, err)); }
    } else if (blockType === "raw") {
      try { content.push(editorjsRawToTiptap(block)); }
      catch (err) { content.push(errorBlock(block, err)); }
    } else if (blockType === "codetool") {
      try { content.push(editorjsCodeToolToTiptap(block)); }
      catch (err) { content.push(errorBlock(block, err)); }
    } else if (blockType === "attaches") {
      try { content.push(editorjsAttachesToTiptap(block)); }
      catch (err) { content.push(errorBlock(block, err)); }
    } else if (blockType === "quote") {
      try { content.push(editorjsQuoteToTiptap(block)); }
      catch (err) { content.push(errorBlock(block, err)); }
    } else if (blockType === "alert") {
      try { content.push(editorjsAlertToTiptap(block)); }
      catch (err) { content.push(errorBlock(block, err)); }
    } else if (blockType === "warning") {
      try { content.push(editorjsWarningToTiptap(block)); }
      catch (err) { content.push(errorBlock(block, err)); }
    } else if (blockType === "columns") {
      try { content.push(editorjsColumnsToTiptap(block, convertBlocks)); }
      catch (err) { content.push(errorBlock(block, err)); }
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
