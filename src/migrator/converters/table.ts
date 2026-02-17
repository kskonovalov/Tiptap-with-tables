import type {
  EditorJSBlock,
  EditorJSTableData,
  TipTapTableNode,
  TipTapTableRowNode,
  TipTapTableCellNode,
  TipTapTableHeaderNode,
  TipTapNode,
} from '../types';
import { parseHTMLToTipTapNodes, convertTipTapNodesToHTML } from '../html-parser';
import { generateBlockId } from '../utils';

/**
 * Converts an HTML cell string into a TipTap paragraph node
 */
function cellToParagraph(html: string): TipTapNode {
  const content = parseHTMLToTipTapNodes(html || '');
  const paragraph: TipTapNode = {
    type: 'paragraph',
    attrs: { textAlign: null },
  };
  if (content.length > 0) {
    paragraph.content = content;
  }
  return paragraph;
}

/**
 * Extracts HTML text from a TipTap cell node by converting its paragraph content
 */
function cellToHTML(cell: TipTapNode): string {
  if (!cell.content || cell.content.length === 0) return '';

  // Collect HTML from all paragraphs in the cell
  return cell.content
    .map((child) => {
      if (child.type === 'paragraph') {
        return convertTipTapNodesToHTML(child.content || []);
      }
      return '';
    })
    .join('');
}

/**
 * Converts EditorJS table block to TipTap table node
 *
 * @example
 * editorjsTableToTiptap({
 *   type: 'Table',
 *   data: {
 *     cols: 2,
 *     rows: 2,
 *     content: [['<b>Header 1</b>', 'Header 2'], ['Cell 1', 'Cell 2']],
 *     withHeadings: true,
 *     filters: { "1": ["val1"] }
 *   }
 * })
 *
 * @param block - EditorJS block with type 'Table'
 * @returns TipTap table node
 */
export function editorjsTableToTiptap(block: EditorJSBlock): TipTapTableNode {
  const data = block.data as EditorJSTableData;
  const rows: TipTapTableRowNode[] = [];

  for (let rowIdx = 0; rowIdx < data.content.length; rowIdx++) {
    const rowData = data.content[rowIdx];
    const isHeaderRow = data.withHeadings && rowIdx === 0;

    const cells: (TipTapTableCellNode | TipTapTableHeaderNode)[] = rowData.map((cellHTML) => {
      const cellType = isHeaderRow ? 'tableHeader' : 'tableCell';
      return {
        type: cellType,
        attrs: {},
        content: [cellToParagraph(cellHTML)],
      } as TipTapTableCellNode | TipTapTableHeaderNode;
    });

    const row: TipTapTableRowNode = {
      type: 'tableRow',
      content: cells,
    };

    rows.push(row);
  }

  const attrs: TipTapTableNode['attrs'] = {
    fullWidth: true,
  };

  if (data.filters && Object.keys(data.filters).length > 0) {
    attrs!.filters = data.filters;
  }

  return {
    type: 'table',
    attrs,
    content: rows,
  };
}

/**
 * Converts TipTap table node to EditorJS table block
 *
 * @example
 * tiptapTableToEditorjs({
 *   type: 'table',
 *   attrs: { filters: { "0": ["val1"] }, fullWidth: true },
 *   content: [
 *     { type: 'tableRow', content: [
 *       { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'H1' }] }] }
 *     ] }
 *   ]
 * })
 *
 * @param node - TipTap table node
 * @returns EditorJS block with type 'Table'
 */
export function tiptapTableToEditorjs(node: TipTapTableNode): EditorJSBlock {
  const tableRows = node.content || [];
  const content: string[][] = [];

  let withHeadings = false;

  for (let rowIdx = 0; rowIdx < tableRows.length; rowIdx++) {
    const row = tableRows[rowIdx];
    const rowCells = row.content || [];

    // Detect headings from first row cell types
    if (rowIdx === 0 && rowCells.length > 0 && rowCells[0].type === 'tableHeader') {
      withHeadings = true;
    }

    const rowContent: string[] = rowCells.map((cell) => cellToHTML(cell));
    content.push(rowContent);
  }

  const cols = content.length > 0 ? content[0].length : 0;
  const rows = content.length;

  const data: EditorJSTableData = {
    cols,
    rows,
    content,
    withHeadings,
    decoded: true,
  };

  if (node.attrs?.filters && Object.keys(node.attrs.filters).length > 0) {
    data.filters = node.attrs.filters;
  }

  return {
    id: generateBlockId(),
    type: 'Table',
    data,
  };
}
