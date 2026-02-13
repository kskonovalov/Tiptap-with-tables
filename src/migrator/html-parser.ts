import type { TipTapMark, TipTapTextNode } from './types';

/**
 * EditorJS HTML -> TipTap text nodes
 * IMPORTANT: This converter uses TipTap standard text color mark:
 *   { type: 'textStyle', attrs: { color: '#ff0000' } }
 *
 * To render it in TipTap, your editor MUST include:
 *   - @tiptap/extension-text-style
 *   - @tiptap/extension-color
 */
export function parseHTMLToTipTapNodes(html: string): TipTapTextNode[] {
  if (html === '' || html == null) return [];

  if (!/<[^>]+>/.test(html)) {
    return [{ type: 'text', text: html }];
  }

  const nodes: TipTapTextNode[] = [];

  const pushText = (text: string, marks: TipTapMark[]) => {
    if (text === '') return;

    const normalizedMarks = normalizeMarks(marks);
    const prev = nodes[nodes.length - 1];

    if (prev && prev.type === 'text' && areMarksEqual(prev.marks || [], normalizedMarks)) {
      prev.text += text;
      return;
    }

    const newNode: TipTapTextNode = { type: 'text', text };
    if (normalizedMarks.length > 0) newNode.marks = normalizedMarks;
    nodes.push(newNode);
  };

  // Browser DOMParser path
  if (typeof DOMParser !== 'undefined' && typeof document !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const container = doc.body.firstElementChild;

    if (!container) return [{ type: 'text', text: html }];

    const marksFromElement = (el: Element): TipTapMark[] => {
      const tagName = el.tagName.toLowerCase();

      if (tagName === 'b' || tagName === 'strong') return [{ type: 'bold' }];
      if (tagName === 'i' || tagName === 'em') return [{ type: 'italic' }];
      if (tagName === 'u') return [{ type: 'underline' }];
      if (tagName === 's' || tagName === 'strike' || tagName === 'del') return [{ type: 'strike' }];
      if (tagName === 'code') return [{ type: 'code' }];
      if (tagName === 'sup') return [{ type: 'superscript' }];
      if (tagName === 'sub') return [{ type: 'subscript' }];

      if (tagName === 'a') {
        const href = el.getAttribute('href');
        if (!href) return [];
        return [
          {
            type: 'link',
            attrs: {
              href,
              target: el.getAttribute('target') || '_blank',
              rel: el.getAttribute('rel') || 'noopener noreferrer nofollow',
              class: el.getAttribute('class') || null,
            },
          },
        ];
      }

      if (tagName === 'mark') {
        const style = el.getAttribute('style') || '';
        const dataColor = el.getAttribute('data-color') || '';
        const bgColor =
          (dataColor && dataColor.trim() !== '' ? dataColor : '') ||
          (style.match(/background-color:\s*([^;]+)/i)?.[1] || '');
        const textColor = style.match(/color:\s*([^;]+)/i)?.[1] || '';
        const className = el.getAttribute('class');

        // If only text color (no bg), treat as textStyle (TipTap Color)
        if (textColor.trim() !== '' && bgColor.trim() === '') {
          return [{ type: 'textStyle', attrs: { color: textColor.trim() } }];
        }

        const attrs: Record<string, any> = {
          color: (bgColor.trim() !== '' ? bgColor.trim() : 'var(--tt-color-highlight-yellow)'),
        };

        if (textColor.trim() !== '') attrs.textColor = textColor.trim();
        if (className && className.trim() !== '') attrs.class = className;

        return [{ type: 'highlight', attrs }];
      }

      if (tagName === 'span') {
        const style = el.getAttribute('style') || '';
        const color = style.match(/color:\s*([^;]+)/i)?.[1] || '';
        if (color.trim() !== '') {
          return [{ type: 'textStyle', attrs: { color: color.trim() } }];
        }
        return [];
      }

      return [];
    };

    const walk = (node: Node, inheritedMarks: TipTapMark[]) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (text !== '') pushText(text, inheritedMarks);
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const el = node as Element;

      if (el.tagName.toLowerCase() === 'br') {
        pushText('<br>', inheritedMarks);
        return;
      }

      const ownMarks = marksFromElement(el);
      const combined = normalizeMarks([...inheritedMarks, ...ownMarks]);

      const childNodes = Array.from(el.childNodes);
      for (const child of childNodes) {
        walk(child, combined);
      }
    };

    const childNodes = Array.from(container.childNodes);
    for (const child of childNodes) {
      walk(child, []);
    }

    return nodes.length > 0 ? nodes : [{ type: 'text', text: '' }];
  }

  // Node.js fallback (regex)
  return parseHTMLSimple(html);
}

/**
 * Node.js fallback HTML -> TipTap text nodes (basic)
 * Supports nested tags via a stack
 */
function parseHTMLSimple(html: string): TipTapTextNode[] {
  const nodes: TipTapTextNode[] = [];
  const tagPattern = /<(\/?)([a-zA-Z][\w:-]*)([^>]*)>/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  const markStack: TipTapMark[] = [];

  const pushText = (text: string) => {
    if (text === '') return;
    const normalized = normalizeMarks(markStack);

    const prev = nodes[nodes.length - 1];
    if (prev && prev.type === 'text' && areMarksEqual(prev.marks || [], normalized)) {
      prev.text += text;
      return;
    }

    const node: TipTapTextNode = { type: 'text', text };
    if (normalized.length > 0) node.marks = normalized;
    nodes.push(node);
  };

  const parseStyleAttr = (attrs: string): string => {
    const m = attrs.match(/style\s*=\s*["']([^"']+)["']/i);
    return m ? m[1] : '';
  };

  const parseAttr = (attrs: string, name: string): string => {
    const re = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i');
    const m = attrs.match(re);
    return m ? m[1] : '';
  };

  const tagToMark = (tagNameRaw: string, attrs: string): TipTapMark | null => {
    const tagName = tagNameRaw.toLowerCase();

    if (tagName === 'b' || tagName === 'strong') return { type: 'bold' };
    if (tagName === 'i' || tagName === 'em') return { type: 'italic' };
    if (tagName === 'u') return { type: 'underline' };
    if (tagName === 's' || tagName === 'strike' || tagName === 'del') return { type: 'strike' };
    if (tagName === 'code') return { type: 'code' };
    if (tagName === 'sup') return { type: 'superscript' };
    if (tagName === 'sub') return { type: 'subscript' };

    if (tagName === 'a') {
      const href = parseAttr(attrs, 'href');
      if (href === '') return null;

      const target = parseAttr(attrs, 'target') || '_blank';
      const rel = parseAttr(attrs, 'rel') || 'noopener noreferrer nofollow';
      const className = parseAttr(attrs, 'class');

      return {
        type: 'link',
        attrs: {
          href,
          target,
          rel,
          class: className !== '' ? className : null,
        },
      };
    }

    if (tagName === 'span') {
      const style = parseStyleAttr(attrs);
      const color = style.match(/color:\s*([^;]+)/i)?.[1] || '';
      if (color.trim() === '') return null;
      return { type: 'textStyle', attrs: { color: color.trim() } };
    }

    if (tagName === 'mark') {
      const style = parseStyleAttr(attrs);
      const className = parseAttr(attrs, 'class');
      const bgColor = style.match(/background-color:\s*([^;]+)/i)?.[1] || '';
      const textColor = style.match(/color:\s*([^;]+)/i)?.[1] || '';

      if (textColor.trim() !== '' && bgColor.trim() === '') {
        return { type: 'textStyle', attrs: { color: textColor.trim() } };
      }

      const outAttrs: Record<string, any> = {
        color: (bgColor.trim() !== '' ? bgColor.trim() : 'var(--tt-color-highlight-yellow)'),
      };

      if (textColor.trim() !== '') outAttrs.textColor = textColor.trim();
      if (className.trim() !== '') outAttrs.class = className;

      return { type: 'highlight', attrs: outAttrs };
    }

    return null;
  };

  const removeMatchingMark = (mark: TipTapMark) => {
    // remove the LAST matching mark (proper nesting)
    for (let i = markStack.length - 1; i >= 0; i--) {
      const m = markStack[i];
      if (m.type === mark.type && stableStringify(m.attrs) === stableStringify(mark.attrs)) {
        markStack.splice(i, 1);
        return;
      }
    }

    // fallback: remove last by type only (handles cases when attrs weren't captured)
    for (let i = markStack.length - 1; i >= 0; i--) {
      if (markStack[i].type === mark.type) {
        markStack.splice(i, 1);
        return;
      }
    }
  };

  while ((match = tagPattern.exec(html)) !== null) {
    if (match.index > lastIndex) {
      pushText(html.substring(lastIndex, match.index));
    }

    const isClosing = match[1] === '/';
    const tagName = match[2];
    const attrs = match[3] || '';

    if (tagName.toLowerCase() === 'br') {
      pushText(match[0]);
      lastIndex = match.index + match[0].length;
      continue;
    }

    if (!isClosing) {
      const mark = tagToMark(tagName, attrs);
      if (mark) markStack.push(mark);
    } else {
      const closingMark = tagToMark(tagName, attrs) || tagToMark(tagName, '');
      if (closingMark) removeMatchingMark(closingMark);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < html.length) {
    pushText(html.substring(lastIndex));
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', text: '' }];
}

/**
 * TipTap text nodes -> EditorJS HTML
 * Supports marks: bold, italic, underline, strike, code, highlight, link, superscript, subscript, textStyle(color)
 */
export function convertTipTapNodesToHTML(nodes: TipTapTextNode[]): string {
  if (!nodes || nodes.length === 0) return '';

  const escapeHTML = (s: string): string => {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const order = [
    'link',
    'highlight',
    'textStyle',
    'code',
    'bold',
    'italic',
    'underline',
    'strike',
    'superscript',
    'subscript',
  ];

  return nodes
    .map((node) => {
      const raw = node.text || '';
      // Escape HTML but preserve <br> / <br/> / <br /> tags
      let text = raw.split(/(<br\s*\/?>)/gi)
        .map((part, i) => i % 2 === 0 ? escapeHTML(part) : '<br>')
        .join('');
      const marks = normalizeMarks(node.marks || []);

      const sortedMarks = [...marks].sort((a, b) => {
        const ai = order.indexOf(a.type);
        const bi = order.indexOf(b.type);
        const aRank = ai === -1 ? 999 : ai;
        const bRank = bi === -1 ? 999 : bi;
        return aRank - bRank;
      });

      for (const mark of sortedMarks) {
        if (mark.type === 'bold') {
          text = `<b>${text}</b>`;
          continue;
        }
        if (mark.type === 'italic') {
          text = `<i>${text}</i>`;
          continue;
        }
        if (mark.type === 'underline') {
          text = `<u>${text}</u>`;
          continue;
        }
        if (mark.type === 'strike') {
          text = `<s>${text}</s>`;
          continue;
        }
        if (mark.type === 'code') {
          text = `<code>${text}</code>`;
          continue;
        }
        if (mark.type === 'superscript') {
          text = `<sup>${text}</sup>`;
          continue;
        }
        if (mark.type === 'subscript') {
          text = `<sub>${text}</sub>`;
          continue;
        }

        if (mark.type === 'link') {
          const href = typeof mark.attrs?.href === 'string' ? mark.attrs.href : '#';
          const target = typeof mark.attrs?.target === 'string' ? mark.attrs.target : '_blank';
          const rel = typeof mark.attrs?.rel === 'string' ? mark.attrs.rel : 'noopener noreferrer nofollow';

          text = `<a href="${escapeAttr(href)}" target="${escapeAttr(target)}" rel="${escapeAttr(rel)}">${text}</a>`;
          continue;
        }

        if (mark.type === 'highlight') {
          const bg = typeof mark.attrs?.color === 'string' ? mark.attrs.color : 'var(--tt-color-highlight-yellow)';
          const tc = typeof mark.attrs?.textColor === 'string' ? mark.attrs.textColor : '';
          const className = typeof mark.attrs?.class === 'string' ? mark.attrs.class : '';

          const styleAttr = tc.trim() !== ''
            ? `background-color: ${bg}; color: ${tc}`
            : `background-color: ${bg}`;

          const classAttr = className.trim() !== '' ? ` class="${escapeAttr(className)}"` : '';

          text = `<mark style="${escapeAttr(styleAttr)}"${classAttr}>${text}</mark>`;
          continue;
        }

        // TipTap standard color mark
        if (mark.type === 'textStyle') {
          const color = typeof mark.attrs?.color === 'string' ? mark.attrs.color.trim() : '';
          if (color !== '') {
            text = `<span style="color: ${escapeAttr(color)}">${text}</span>`;
          }
          continue;
        }
      }

      return text;
    })
    .join('');

  function escapeAttr(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

/**
 * Marks utilities
 */
function normalizeMarks(marks: TipTapMark[]): TipTapMark[] {
  if (!marks || marks.length === 0) return [];

  const out: TipTapMark[] = [];
  const seen = new Set<string>();

  for (const mark of marks) {
    const attrs = mark.attrs && typeof mark.attrs === 'object' ? mark.attrs : undefined;
    const normalized: TipTapMark = attrs ? { type: mark.type, attrs } : { type: mark.type };
    const key = `${normalized.type}::${stableStringify(normalized.attrs)}`;

    if (!seen.has(key)) {
      seen.add(key);
      out.push(normalized);
    }
  }

  // sort for deterministic comparisons/merges
  out.sort((a, b) => {
    const t = a.type.localeCompare(b.type);
    if (t !== 0) return t;
    return stableStringify(a.attrs).localeCompare(stableStringify(b.attrs));
  });

  return out;
}

function areMarksEqual(marks1: TipTapMark[], marks2: TipTapMark[]): boolean {
  const a = normalizeMarks(marks1);
  const b = normalizeMarks(marks2);
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i].type !== b[i].type) return false;
    if (stableStringify(a[i].attrs) !== stableStringify(b[i].attrs)) return false;
  }

  return true;
}

function stableStringify(value: any): string {
  if (value == null) return '{}';
  if (typeof value !== 'object') return JSON.stringify(value);

  const keys = Object.keys(value).sort();
  const obj: Record<string, any> = {};
  for (const k of keys) obj[k] = value[k];
  return JSON.stringify(obj);
}
