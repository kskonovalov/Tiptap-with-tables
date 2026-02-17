// EditorJS Types
export interface EditorJSBlock {
  id?: string;
  type: string;
  data: Record<string, any>;
  tunes?: {
    alignmentTune?: {
      alignment?: 'left' | 'center' | 'right' | 'justify';
    };
    [key: string]: any;
  };
}

export interface EditorJSData {
  time?: number;
  blocks: EditorJSBlock[];
  version?: string;
}

export interface EditorJSParagraphData {
  text: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  [key: string]: any; // Allow additional parameters
}

// TipTap Types
export interface TipTapMark {
  type: string;
  attrs?: Record<string, any>;
}

export interface TipTapTextNode {
  type: 'text';
  text: string;
  marks?: TipTapMark[];
}

export interface TipTapNode {
  type: string;
  attrs?: Record<string, any>;
  content?: (TipTapNode | TipTapTextNode)[];
  text?: string;
  marks?: TipTapMark[];
}

export interface TipTapDocument {
  type: 'doc';
  content: TipTapNode[];
}

export interface TipTapParagraphNode extends TipTapNode {
  type: 'paragraph';
  attrs?: {
    textAlign?: 'left' | 'center' | 'right' | 'justify' | null;
  };
  content?: TipTapTextNode[];
}

export interface EditorJSHeaderData {
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  [key: string]: any;
}

export interface TipTapHeadingNode extends TipTapNode {
  type: 'heading';
  attrs?: {
    level: 1 | 2 | 3 | 4 | 5 | 6;
    textAlign?: 'left' | 'center' | 'right' | 'justify' | null;
  };
  content?: TipTapTextNode[];
}

// EditorJS List Types (@editorjs/list)

/** Nested item format (List 2.0+) */
export interface EditorJSListItem {
  content: string;
  meta: Record<string, any>;
  items: EditorJSListItem[];
}

export interface EditorJSListData {
  /** @deprecated Use meta.style instead. Kept for backwards compat reading. */
  style?: 'ordered' | 'unordered' | 'checklist';
  meta?: {
    style?: 'ordered' | 'unordered' | 'checklist';
    start?: number;
    [key: string]: any;
  };
  items: EditorJSListItem[] | string[];
  [key: string]: any;
}

// TipTap List Types

export interface TipTapListItemNode extends TipTapNode {
  type: 'listItem';
  content?: (TipTapParagraphNode | TipTapNode)[];
}

export interface TipTapTaskItemNode extends TipTapNode {
  type: 'taskItem';
  attrs?: { checked: boolean };
  content?: (TipTapParagraphNode | TipTapNode)[];
}

export interface TipTapBulletListNode extends TipTapNode {
  type: 'bulletList';
  content?: TipTapListItemNode[];
}

export interface TipTapOrderedListNode extends TipTapNode {
  type: 'orderedList';
  attrs?: { start?: number };
  content?: TipTapListItemNode[];
}

export interface TipTapTaskListNode extends TipTapNode {
  type: 'taskList';
  content?: TipTapTaskItemNode[];
}

// EditorJS Table Types
export interface EditorJSTableData {
  cols: number;
  rows: number;
  content: string[][];
  withHeadings: boolean;
  decoded?: boolean;
  filters?: Record<string, string[]>;
}

// TipTap Table Types
export interface TipTapTableCellNode extends TipTapNode {
  type: 'tableCell';
  attrs?: Record<string, any>;
  content?: TipTapNode[];
}

export interface TipTapTableHeaderNode extends TipTapNode {
  type: 'tableHeader';
  attrs?: Record<string, any>;
  content?: TipTapNode[];
}

export interface TipTapTableRowNode extends TipTapNode {
  type: 'tableRow';
  attrs?: { hidden?: boolean };
  content?: (TipTapTableCellNode | TipTapTableHeaderNode)[];
}

export interface TipTapTableNode extends TipTapNode {
  type: 'table';
  attrs?: {
    filters?: Record<string, string[]>;
    fullWidth?: boolean;
  };
  content?: TipTapTableRowNode[];
}
