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
 * Extracts plain text from an HTML string by stripping tags
 */
function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Collects all unique plain-text values for a column from data rows
 * (skips the header row when withHeadings is true)
 */
function collectColumnValues(content: string[][], colIndex: number, withHeadings: boolean): string[] {
  const values = new Set<string>();
  const startRow = withHeadings ? 1 : 0;
  for (let rowIdx = startRow; rowIdx < content.length; rowIdx++) {
    const cell = content[rowIdx][colIndex];
    if (cell !== undefined) {
      values.add(stripHTML(cell));
    }
  }
  return Array.from(values);
}

/**
 * Inverts filter values: given all values and a subset, returns the complement.
 * EditorJS filters = visible values, TipTap filters = hidden values.
 */
function invertFilter(allValues: string[], subsetValues: string[]): string[] {
  const subsetSet = new Set(subsetValues);
  return allValues.filter((v) => !subsetSet.has(v));
}

/**
 * Collects all unique plain-text values for a column from TipTap table rows
 * (skips header rows)
 */
function collectTiptapColumnValues(tableRows: TipTapTableRowNode[], colIndex: number): string[] {
  const values = new Set<string>();
  for (const row of tableRows) {
    const cells = row.content || [];
    // Skip header rows
    if (cells.length > 0 && cells[0].type === 'tableHeader') continue;
    const cell = cells[colIndex];
    if (cell) {
      values.add(cellToHTML(cell).replace(/<[^>]*>/g, '').trim());
    }
  }
  return Array.from(values);
}

/**
 * Converts EditorJS table block to TipTap table node
 *
 * Filter semantics:
 * - EditorJS filters[colIndex] = values that should be VISIBLE
 * - TipTap filters[colIndex] = values that should be HIDDEN
 * The converter inverts the filter and also sets `hidden` on rows accordingly.
 *
 * @param block - EditorJS block with type 'Table'
 * @returns TipTap table node
 */
export function editorjsTableToTiptap(block: EditorJSBlock): TipTapTableNode {
  const data = block.data as EditorJSTableData;

  // First, invert filters: EditorJS visible → TipTap hidden
  let tiptapFilters: Record<string, string[]> | undefined;
  if (data.filters && Object.keys(data.filters).length > 0) {
    tiptapFilters = {};
    for (const colKey of Object.keys(data.filters)) {
      const colIndex = parseInt(colKey, 10);
      const visibleValues = data.filters[colKey];
      const allValues = collectColumnValues(data.content, colIndex, data.withHeadings);
      const hiddenValues = invertFilter(allValues, visibleValues);
      if (hiddenValues.length > 0) {
        tiptapFilters[colKey] = hiddenValues;
      }
    }
    if (Object.keys(tiptapFilters).length === 0) {
      tiptapFilters = undefined;
    }
  }

  // Build rows
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

    // Compute hidden: a data row is hidden if any of its cell values
    // appears in that column's TipTap hidden filter
    let hidden = false;
    if (!isHeaderRow && tiptapFilters) {
      for (const colKey of Object.keys(tiptapFilters)) {
        const colIndex = parseInt(colKey, 10);
        const cellText = stripHTML(rowData[colIndex] || '');
        if (tiptapFilters[colKey].includes(cellText)) {
          hidden = true;
          break;
        }
      }
    }

    const row: TipTapTableRowNode = {
      type: 'tableRow',
      attrs: { hidden },
      content: cells,
    };

    rows.push(row);
  }

  const attrs: TipTapTableNode['attrs'] = {
    fullWidth: true,
  };

  if (tiptapFilters) {
    attrs!.filters = tiptapFilters;
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
 * Filter semantics:
 * - TipTap filters[colIndex] = values that should be HIDDEN
 * - EditorJS filters[colIndex] = values that should be VISIBLE
 * The converter inverts the filter accordingly.
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

  // Invert filters: TipTap hidden → EditorJS visible
  if (node.attrs?.filters && Object.keys(node.attrs.filters).length > 0) {
    const editorjsFilters: Record<string, string[]> = {};
    for (const colKey of Object.keys(node.attrs.filters)) {
      const colIndex = parseInt(colKey, 10);
      const hiddenValues = node.attrs.filters[colKey];
      const allValues = collectTiptapColumnValues(tableRows, colIndex);
      const visibleValues = invertFilter(allValues, hiddenValues);
      if (visibleValues.length > 0) {
        editorjsFilters[colKey] = visibleValues;
      }
    }
    if (Object.keys(editorjsFilters).length > 0) {
      data.filters = editorjsFilters;
    }
  }

  return {
    id: generateBlockId(),
    type: 'Table',
    data,
  };
}
