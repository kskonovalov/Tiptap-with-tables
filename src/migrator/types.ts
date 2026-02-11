// EditorJS Types
export interface EditorJSBlock {
  id?: string;
  type: string;
  data: Record<string, any>;
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
