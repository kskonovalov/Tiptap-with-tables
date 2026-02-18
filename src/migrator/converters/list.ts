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
  const textAlign = (block.tunes?.alignmentTune?.alignment ?? null) as
    | 'left'
    | 'center'
    | 'right'
    | 'justify'
    | null;

  if (style === 'checklist') {
    return buildTaskList(items, textAlign);
  }

  if (style === 'ordered') {
    return buildOrderedList(items, data.meta, textAlign);
  }

  return buildBulletList(items, textAlign);
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

  const block: EditorJSBlock = { id: generateBlockId(), type: 'list', data };

  const firstParagraph = (node.content?.[0] as TipTapNode | undefined)?.content?.find(
    (c) => c.type === 'paragraph',
  ) as TipTapParagraphNode | undefined;
  const alignment = firstParagraph?.attrs?.textAlign;
  if (alignment && alignment !== 'left') {
    block.tunes = { alignmentTune: { alignment } };
  }

  return block;
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

type TextAlign = 'left' | 'center' | 'right' | 'justify' | null;

function buildBulletList(items: EditorJSListItem[], textAlign: TextAlign = null): TipTapBulletListNode {
  return {
    type: 'bulletList',
    content: items.map((item) => buildListItem(item, 'unordered', textAlign)),
  };
}

function buildOrderedList(items: EditorJSListItem[], meta?: Record<string, any>, textAlign: TextAlign = null): TipTapOrderedListNode {
  const node: TipTapOrderedListNode = {
    type: 'orderedList',
    attrs: { start: meta?.start ?? 1 },
    content: items.map((item) => buildListItem(item, 'ordered', textAlign)),
  };
  return node;
}

function buildTaskList(items: EditorJSListItem[], textAlign: TextAlign = null): TipTapTaskListNode {
  return {
    type: 'taskList',
    content: items.map((item) => buildTaskItem(item, textAlign)),
  };
}

function buildListItem(item: EditorJSListItem, parentStyle: 'ordered' | 'unordered', textAlign: TextAlign): TipTapListItemNode {
  const paragraph = textToParagraph(item.content, textAlign);
  const content: (TipTapParagraphNode | TipTapNode)[] = [paragraph];

  if (item.items && item.items.length > 0) {
    const nestedList =
      parentStyle === 'ordered'
        ? buildOrderedList(item.items, undefined, textAlign)
        : buildBulletList(item.items, textAlign);
    content.push(nestedList);
  }

  return { type: 'listItem', content };
}

function buildTaskItem(item: EditorJSListItem, textAlign: TextAlign): TipTapTaskItemNode {
  const paragraph = textToParagraph(item.content, textAlign);
  const content: (TipTapParagraphNode | TipTapNode)[] = [paragraph];

  if (item.items && item.items.length > 0) {
    content.push(buildTaskList(item.items, textAlign));
  }

  return {
    type: 'taskItem',
    attrs: { checked: !!item.meta?.checked },
    content,
  };
}

function textToParagraph(html: string, textAlign: TextAlign = null): TipTapParagraphNode {
  const contentNodes = parseHTMLToTipTapNodes(html || '');
  const node: TipTapParagraphNode = {
    type: 'paragraph',
    attrs: { textAlign },
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
