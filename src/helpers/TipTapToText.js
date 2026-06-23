/**
 * Converts a TipTap document object to a plain-text string.
 * Each block node becomes a separate line.
 * Tables: one row per line, cells separated by TABLE_DIVIDER.
 *
 * Usage:
 *   import { tiptapToText } from './helpers/TipTapToText.js';
 *   const text = tiptapToText(editor.getJSON());
 */

/**
 * @typedef {{ type: string; attrs?: Record<string, any> }} TipTapMark
 */

/**
 * @typedef {{
 *   type: string;
 *   text?: string;
 *   marks?: TipTapMark[];
 *   attrs?: Record<string, any>;
 *   content?: TipTapNode[];
 * }} TipTapNode
 */

/**
 * @typedef {{ type: 'doc'; content: TipTapNode[] }} TipTapDocument
 */

export const TABLE_DIVIDER = ';';

/**
 * Recursively extracts plain text from a node subtree, ignoring block structure.
 * Used for inline contexts (table cells, headings, paragraphs, etc.).
 * @param {TipTapNode[] | undefined} nodes
 * @returns {string}
 */
function extractInlineText(nodes) {
  if (!nodes?.length) return '';
  return nodes
    .map((n) => {
      if (n.type === 'text') return n.text || '';
      if (n.type === 'hardBreak') return '\n';
      return extractInlineText(n.content);
    })
    .join('');
}

/**
 * Converts block-level children to lines joined with '\n', skipping empty lines.
 * @param {TipTapNode[] | undefined} nodes
 * @returns {string}
 */
function blockLines(nodes) {
  if (!nodes?.length) return '';
  return nodes.map(nodeToText).filter((s) => s !== '').join('\n');
}

/**
 * Converts a single TipTap node to a plain-text string.
 * @param {TipTapNode} node
 * @returns {string}
 */
function nodeToText(node) {
  switch (node.type) {

    // ── Root ──────────────────────────────────────────────────────────────────
    case 'doc':
      return blockLines(node.content);

    // ── Inline ────────────────────────────────────────────────────────────────
    case 'text':
      return node.text || '';

    case 'hardBreak':
      return '\n';

    // ── Paragraphs & headings ─────────────────────────────────────────────────
    case 'paragraph':
    case 'heading':
    case 'blockquote':
    case 'codeBlock':
      return extractInlineText(node.content);

    case 'horizontalRule':
      return '';

    // ── Lists ─────────────────────────────────────────────────────────────────
    case 'bulletList':
    case 'orderedList':
    case 'taskList':
      return blockLines(node.content);

    case 'listItem':
    case 'taskItem':
      return blockLines(node.content);

    // ── Table ─────────────────────────────────────────────────────────────────
    case 'table':
      return (node.content ?? [])
        .filter((r) => !r.attrs?.hidden)
        .map(nodeToText)
        .filter(Boolean)
        .join('\n');

    case 'tableRow':
      return node.attrs?.hidden
        ? ''
        : (node.content ?? []).map(nodeToText).join(TABLE_DIVIDER);

    case 'tableCell':
    case 'tableHeader':
      return extractInlineText(node.content);

    // ── Media ─────────────────────────────────────────────────────────────────
    case 'image':
      return node.attrs?.alt || '';

    case 'video':
      return '';

    case 'file': {
      const { url = '', title = '' } = node.attrs || {};
      return title || url;
    }

    // ── Details / toggle ──────────────────────────────────────────────────────
    case 'details':
    case 'detailsContent':
      return blockLines(node.content);

    case 'detailsSummary':
      return extractInlineText(node.content);

    // ── Alert ─────────────────────────────────────────────────────────────────
    case 'alert':
      return blockLines(node.content);

    // ── Warning ───────────────────────────────────────────────────────────────
    case 'warning':
      return blockLines(node.content);

    case 'warningTitle':
    case 'warningMessage':
      return extractInlineText(node.content);

    // ── Columns ───────────────────────────────────────────────────────────────
    case 'columns':
    case 'columnItem':
      return blockLines(node.content);

    // ── Fallback ──────────────────────────────────────────────────────────────
    default:
      if (node.text != null) return node.text;
      return blockLines(node.content);
  }
}

/**
 * Converts a TipTap document (or any TipTap node) to a plain-text string.
 *
 * @param {TipTapDocument | TipTapNode} doc
 * @returns {string}
 *
 * @example
 * const text = tiptapToText(editor.getJSON());
 * // 'Title\nHello world\nCol1;Col2\nVal1;Val2'
 */
export function tiptapToText(doc) {
  return nodeToText(/** @type {TipTapNode} */ (doc));
}

export default tiptapToText;
