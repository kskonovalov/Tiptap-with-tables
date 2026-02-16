import type {
  EditorJSBlock,
  EditorJSListData,
  EditorJSListItem,
  TipTapNode,
  TipTapTextNode,
  TipTapParagraphNode,
  TipTapListItemNode,
  TipTapTaskItemNode,
  TipTapBulletListNode,
  TipTapOrderedListNode,
  TipTapTaskListNode,
} from '../types';
import { parseHTMLToTipTapNodes, convertTipTapNodesToHTML } from '../html-parser';
import { generateBlockId } from '../utils';

// ---------------------------------------------------------------------------
// EditorJS -> TipTap
// ---------------------------------------------------------------------------

/**
 * Converts an EditorJS list block to TipTap list node(s).
 * Handles ordered, unordered, and checklist styles.
 * Supports both legacy flat format (string[]) and nested format (EditorJSListItem[]).
 *
 * @param block - EditorJS block with type 'list'
 * @returns TipTap bulletList / orderedList / taskList node
 */
export function editorjsListToTiptap(block: EditorJSBlock): TipTapNode {
  const data = block.data as EditorJSListData;
  const style = data.meta?.style || data.style || 'unordered';
  const items = normalizeItems(data.items);

  if (style === 'checklist') {
    return buildTaskList(items);
  }

  if (style === 'ordered') {
    return buildOrderedList(items, data.meta);
  }

  return buildBulletList(items);
}

// ---------------------------------------------------------------------------
// TipTap -> EditorJS
// ---------------------------------------------------------------------------

/**
 * Converts a TipTap bulletList / orderedList / taskList node to an EditorJS list block.
 *
 * @param node - TipTap list node
 * @returns EditorJS block with type 'list'
 */
export function tiptapListToEditorjs(node: TipTapNode): EditorJSBlock {
  const style = listNodeStyle(node.type);

  const items: EditorJSListItem[] =
    node.type === 'taskList'
      ? (node.content || []).map(taskItemToEditorjs)
      : (node.content || []).map((li) => listItemToEditorjs(li, style));

  const data: EditorJSListData = { style, items };

  if (node.type === 'orderedList' && node.attrs?.start && node.attrs.start !== 1) {
    data.meta = { start: node.attrs.start };
  }

  return { id: generateBlockId(), type: 'list', data };
}

// ---------------------------------------------------------------------------
// Internal helpers — EditorJS -> TipTap
// ---------------------------------------------------------------------------

/** Normalize legacy flat items (string[]) to the nested format */
function normalizeItems(items: EditorJSListItem[] | string[]): EditorJSListItem[] {
  if (items.length === 0) return [];

  if (typeof items[0] === 'string') {
    return (items as string[]).map((text) => ({
      content: text,
      meta: {},
      items: [],
    }));
  }

  return items as EditorJSListItem[];
}

function buildBulletList(items: EditorJSListItem[]): TipTapBulletListNode {
  return {
    type: 'bulletList',
    content: items.map((item) => buildListItem(item, 'unordered')),
  };
}

function buildOrderedList(items: EditorJSListItem[], meta?: Record<string, any>): TipTapOrderedListNode {
  const node: TipTapOrderedListNode = {
    type: 'orderedList',
    attrs: { start: meta?.start ?? 1 },
    content: items.map((item) => buildListItem(item, 'ordered')),
  };
  return node;
}

function buildTaskList(items: EditorJSListItem[]): TipTapTaskListNode {
  return {
    type: 'taskList',
    content: items.map(buildTaskItem),
  };
}

function buildListItem(item: EditorJSListItem, parentStyle: 'ordered' | 'unordered'): TipTapListItemNode {
  const paragraph = textToParagraph(item.content);
  const content: (TipTapParagraphNode | TipTapNode)[] = [paragraph];

  if (item.items && item.items.length > 0) {
    const nestedList =
      parentStyle === 'ordered'
        ? buildOrderedList(item.items)
        : buildBulletList(item.items);
    content.push(nestedList);
  }

  return { type: 'listItem', content };
}

function buildTaskItem(item: EditorJSListItem): TipTapTaskItemNode {
  const paragraph = textToParagraph(item.content);
  const content: (TipTapParagraphNode | TipTapNode)[] = [paragraph];

  if (item.items && item.items.length > 0) {
    content.push(buildTaskList(item.items));
  }

  return {
    type: 'taskItem',
    attrs: { checked: !!item.meta?.checked },
    content,
  };
}

function textToParagraph(html: string): TipTapParagraphNode {
  const contentNodes = parseHTMLToTipTapNodes(html || '');
  const node: TipTapParagraphNode = {
    type: 'paragraph',
    attrs: { textAlign: null },
  };
  if (contentNodes.length > 0) {
    (node as TipTapNode).content = contentNodes;
  }
  return node;
}

// ---------------------------------------------------------------------------
// Internal helpers — TipTap -> EditorJS
// ---------------------------------------------------------------------------

function listNodeStyle(type: string): 'ordered' | 'unordered' | 'checklist' {
  if (type === 'orderedList') return 'ordered';
  if (type === 'taskList') return 'checklist';
  return 'unordered';
}

function listItemToEditorjs(li: TipTapNode | TipTapTextNode, style: string): EditorJSListItem {
  const children = (li as TipTapNode).content || [];

  // First paragraph holds the text
  const paragraphNode = children.find((c) => c.type === 'paragraph') as TipTapParagraphNode | undefined;
  const text = paragraphNode ? convertTipTapNodesToHTML(paragraphNode.content || []) : '';

  // Nested list (if any)
  const nestedList = children.find(
    (c) => c.type === 'bulletList' || c.type === 'orderedList' || c.type === 'taskList',
  ) as TipTapNode | undefined;

  const nestedItems: EditorJSListItem[] = nestedList
    ? (nestedList.content || []).map((child) => listItemToEditorjs(child, style))
    : [];

  return {
    content: text,
    meta: {},
    items: nestedItems,
  };
}

function taskItemToEditorjs(ti: TipTapNode | TipTapTextNode): EditorJSListItem {
  const node = ti as TipTapTaskItemNode;
  const children = node.content || [];

  const paragraphNode = children.find((c) => c.type === 'paragraph') as TipTapParagraphNode | undefined;
  const text = paragraphNode ? convertTipTapNodesToHTML(paragraphNode.content || []) : '';

  const nestedList = children.find((c) => c.type === 'taskList') as TipTapNode | undefined;
  const nestedItems: EditorJSListItem[] = nestedList
    ? (nestedList.content || []).map(taskItemToEditorjs)
    : [];

  return {
    content: text,
    meta: { checked: !!node.attrs?.checked },
    items: nestedItems,
  };
}
