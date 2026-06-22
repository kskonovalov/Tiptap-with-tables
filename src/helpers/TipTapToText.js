/**
 * Converts a TipTap document object to an HTML string.
 * Supports arbitrary nesting — tables inside lists, lists inside tables, etc.
 *
 * Usage:
 *   import { tiptapToText } from './helpers/TipTapToText.js';
 *   const html = tiptapToText(editor.getJSON());
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

/** @type {Record<string, string>} */
const HTML_ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, (c) => HTML_ESCAPE_MAP[c] ?? c);
}

/**
 * @param {TipTapNode[]} [nodes]
 * @returns {string}
 */
function childrenToHTML(nodes) {
  if (!nodes || nodes.length === 0) return '';
  return nodes.map(nodeToHTML).join('');
}

/**
 * Wraps an already-escaped HTML string with the tag for one mark.
 * @param {string} html
 * @param {TipTapMark} mark
 * @returns {string}
 */
function applyMark(html, mark) {
  switch (mark.type) {
    case 'bold':        return `<strong>${html}</strong>`;
    case 'italic':      return `<em>${html}</em>`;
    case 'underline':   return `<u>${html}</u>`;
    case 'strike':      return `<s>${html}</s>`;
    case 'code':        return `<code>${html}</code>`;
    case 'highlight':   return `<mark>${html}</mark>`;
    case 'subscript':   return `<sub>${html}</sub>`;
    case 'superscript': return `<sup>${html}</sup>`;
    case 'link': {
      const href = escapeHTML(mark.attrs?.href || '');
      const target = mark.attrs?.target ? ` target="${escapeHTML(mark.attrs.target)}"` : '';
      return `<a href="${href}"${target}>${html}</a>`;
    }
    case 'textStyle': {
      const color = mark.attrs?.color;
      return color ? `<span style="color:${escapeHTML(color)}">${html}</span>` : html;
    }
    default: return html;
  }
}

/**
 * Converts a single TipTap node of any type to its HTML string.
 * Unknown container nodes fall back to rendering their children.
 * Unknown leaf nodes return an empty string.
 * @param {TipTapNode} node
 * @returns {string}
 */
function nodeToHTML(node) {
  switch (node.type) {

    // ── Root ──────────────────────────────────────────────────────────────────
    case 'doc':
      return childrenToHTML(node.content);

    // ── Inline ────────────────────────────────────────────────────────────────
    case 'text': {
      let html = escapeHTML(node.text || '');
      for (const mark of node.marks || []) html = applyMark(html, mark);
      return html;
    }
    case 'hardBreak':
      return '<br />';

    // ── Paragraphs & headings ─────────────────────────────────────────────────
    case 'paragraph':
      return `<p>${childrenToHTML(node.content)}</p>`;

    case 'heading': {
      const level = node.attrs?.level || 1;
      return `<h${level}>${childrenToHTML(node.content)}</h${level}>`;
    }

    // ── Other text blocks ─────────────────────────────────────────────────────
    case 'blockquote':
      return `<blockquote>${childrenToHTML(node.content)}</blockquote>`;

    case 'codeBlock': {
      const lang = node.attrs?.language;
      const langAttr = lang ? ` class="language-${escapeHTML(lang)}"` : '';
      return `<pre><code${langAttr}>${childrenToHTML(node.content)}</code></pre>`;
    }

    case 'horizontalRule':
      return '<hr />';

    // ── Lists ─────────────────────────────────────────────────────────────────
    case 'bulletList':
      return `<ul>${childrenToHTML(node.content)}</ul>`;

    case 'orderedList': {
      const start = node.attrs?.start;
      const startAttr = start != null && start !== 1 ? ` start="${start}"` : '';
      return `<ol${startAttr}>${childrenToHTML(node.content)}</ol>`;
    }

    case 'taskList':
      return `<ul class="task-list">${childrenToHTML(node.content)}</ul>`;

    case 'listItem':
      return `<li>${childrenToHTML(node.content)}</li>`;

    case 'taskItem': {
      const checked = node.attrs?.checked ? ' checked' : '';
      return `<li><input type="checkbox" disabled${checked} />${childrenToHTML(node.content)}</li>`;
    }

    // ── Table ─────────────────────────────────────────────────────────────────
    case 'table':
      return `<table>${childrenToHTML(node.content)}</table>`;

    case 'tableRow':
      return node.attrs?.hidden ? '' : `<tr>${childrenToHTML(node.content)}</tr>`;

    case 'tableCell':
      return `<td>${childrenToHTML(node.content)}</td>`;

    case 'tableHeader':
      return `<th>${childrenToHTML(node.content)}</th>`;

    // ── Media ─────────────────────────────────────────────────────────────────
    case 'image': {
      const { src = '', alt = '', title = '' } = node.attrs || {};
      const titleAttr = title ? ` title="${escapeHTML(title)}"` : '';
      return `<img src="${escapeHTML(src)}" alt="${escapeHTML(alt)}"${titleAttr} />`;
    }

    case 'video':
      // attrs.content is a raw iframe/embed HTML string — not escaped intentionally
      return `<div class="video">${node.attrs?.content || ''}</div>`;

    case 'file': {
      const { url = '', title = '', extension = '' } = node.attrs || {};
      const label = escapeHTML(title || url);
      const ext = extension ? ` (${escapeHTML(extension)})` : '';
      return `<a href="${escapeHTML(url)}" class="file">${label}${ext}</a>`;
    }

    // ── Details / toggle ──────────────────────────────────────────────────────
    case 'details':
      return `<details${node.attrs?.open ? ' open' : ''}>${childrenToHTML(node.content)}</details>`;

    case 'detailsSummary':
      return `<summary>${childrenToHTML(node.content)}</summary>`;

    case 'detailsContent':
      return childrenToHTML(node.content);

    // ── Alert ─────────────────────────────────────────────────────────────────
    case 'alert': {
      const type = escapeHTML(node.attrs?.type || 'primary');
      return `<div class="alert alert-${type}">${childrenToHTML(node.content)}</div>`;
    }

    // ── Warning ───────────────────────────────────────────────────────────────
    case 'warning':
      return `<div class="warning">${childrenToHTML(node.content)}</div>`;

    case 'warningTitle':
      return `<strong class="warning-title">${childrenToHTML(node.content)}</strong>`;

    case 'warningMessage':
      return `<div class="warning-message">${childrenToHTML(node.content)}</div>`;

    // ── Columns ───────────────────────────────────────────────────────────────
    case 'columns':
      return `<div class="columns">${childrenToHTML(node.content)}</div>`;

    case 'columnItem':
      return `<div class="column">${childrenToHTML(node.content)}</div>`;

    // ── Fallback ──────────────────────────────────────────────────────────────
    default:
      // Container nodes: render children. Leaf nodes: empty string.
      return childrenToHTML(node.content);
  }
}

/**
 * Converts a TipTap document (or any TipTap node) to an HTML string.
 *
 * @param {TipTapDocument | TipTapNode} doc
 * @returns {string}
 *
 * @example
 * const html = tiptapToText(editor.getJSON());
 * // '<h1>Title</h1><p>Hello <strong>world</strong></p>'
 */
export function tiptapToText(doc) {
  return nodeToHTML(/** @type {TipTapNode} */ (doc));
}

export default tiptapToText;
