import { TipTapMark, TipTapTextNode } from './types';

/**
 * Parses HTML string from EditorJS into TipTap text nodes with marks
 * Handles common HTML tags: <b>, <strong>, <i>, <em>, <u>, <s>, <code>, <mark>, <a>, <span>, <sup>, <sub>
 *
 * @example
 * parseHTMLToTipTapNodes('Hello <b>world</b>!')
 * // Returns: [
 * //   { type: 'text', text: 'Hello ' },
 * //   { type: 'text', text: 'world', marks: [{ type: 'bold' }] },
 * //   { type: 'text', text: '!' }
 * // ]
 */
export function parseHTMLToTipTapNodes(html: string): TipTapTextNode[] {
  if (!html) return [];

  // If no HTML tags, return simple text node
  if (!/<[^>]+>/.test(html)) {
    return [{ type: 'text', text: html }];
  }

  const nodes: TipTapTextNode[] = [];

  // Use DOMParser if available (browser environment)
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const container = doc.body.firstChild;

    if (!container) {
      return [{ type: 'text', text: html }];
    }

    function extractMarksFromElement(element: Element): TipTapMark[] {
      const marks: TipTapMark[] = [];
      let current: Element | null = element;

      while (current && current.nodeName !== 'DIV') {
        const tagName = current.nodeName.toLowerCase();

        switch (tagName) {
          case 'b':
          case 'strong':
            marks.push({ type: 'bold' });
            break;
          case 'i':
          case 'em':
            marks.push({ type: 'italic' });
            break;
          case 'u':
            marks.push({ type: 'underline' });
            break;
          case 's':
          case 'strike':
          case 'del':
            marks.push({ type: 'strike' });
            break;
          case 'code':
            marks.push({ type: 'code' });
            break;
          case 'mark':
            const style = current.getAttribute('style') || '';
            const bgColor = current.getAttribute('data-color') ||
                           style.match(/background-color:\s*([^;]+)/)?.[1];
            const textColor = style.match(/color:\s*([^;]+)/)?.[1];
            const className = current.getAttribute('class');

            // If only text color (no background), treat as textColor mark
            if (textColor && !bgColor) {
              marks.push({
                type: 'textColor',
                attrs: { color: textColor.trim() }
              });
            } else {
              // Has background color, treat as highlight
              const highlightAttrs: { color: string; textColor?: string; class?: string | null } = {
                color: (bgColor || 'var(--tt-color-highlight-yellow)').trim()
              };

              if (textColor) {
                highlightAttrs.textColor = textColor.trim();
              }

              if (className) {
                highlightAttrs.class = className;
              }

              marks.push({
                type: 'highlight',
                attrs: highlightAttrs
              });
            }
            break;
          case 'a':
            const href = current.getAttribute('href');
            if (href) {
              marks.push({
                type: 'link',
                attrs: {
                  href,
                  target: current.getAttribute('target') || '_blank',
                  rel: 'noopener noreferrer nofollow',
                  class: null
                }
              });
            }
            break;
          case 'sup':
            marks.push({ type: 'superscript' });
            break;
          case 'sub':
            marks.push({ type: 'subscript' });
            break;
          case 'span':
            const spanStyle = current.getAttribute('style');
            if (spanStyle) {
              const spanColor = spanStyle.match(/color:\s*([^;]+)/)?.[1];
              if (spanColor) {
                marks.push({
                  type: 'textColor',
                  attrs: { color: spanColor.trim() }
                });
              }
            }
            break;
        }

        current = current.parentElement;
      }

      return marks;
    }

    function processNode(node: Node, parentMarks: TipTapMark[] = []): void {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (text) {
          const existingNode = nodes[nodes.length - 1];

          // Merge with previous node if marks are identical
          if (existingNode && areMarksEqual(existingNode.marks || [], parentMarks)) {
            existingNode.text += text;
          } else {
            const newNode: TipTapTextNode = { type: 'text', text };
            if (parentMarks.length > 0) {
              newNode.marks = parentMarks;
            }
            nodes.push(newNode);
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const marks = extractMarksFromElement(element);

        // Process child nodes
        Array.from(element.childNodes).forEach(child => {
          processNode(child, marks);
        });
      }
    }

    Array.from(container.childNodes).forEach(child => {
      processNode(child);
    });
  } else {
    // Fallback for Node.js environment - simple regex-based parsing
    nodes.push(...parseHTMLSimple(html));
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', text: '' }];
}

/**
 * Simple HTML parser fallback for Node.js environments
 * Handles basic nested tags
 */
function parseHTMLSimple(html: string): TipTapTextNode[] {
  const nodes: TipTapTextNode[] = [];
  const tagPattern = /<(\/?)(\w+)([^>]*)>/g;
  let lastIndex = 0;
  let match;
  const markStack: TipTapMark[] = [];

  const tagToMark = (tag: string, attrs: string): TipTapMark | null => {
    switch (tag.toLowerCase()) {
      case 'b':
      case 'strong':
        return { type: 'bold' };
      case 'i':
      case 'em':
        return { type: 'italic' };
      case 'u':
        return { type: 'underline' };
      case 's':
      case 'strike':
      case 'del':
        return { type: 'strike' };
      case 'code':
        return { type: 'code' };
      case 'mark':
        const styleMatch = attrs.match(/style=["']([^"']+)["']/);
        const classMatch = attrs.match(/class=["']([^"']+)["']/);

        let bgColorMatch = null;
        let textColorMatch = null;

        if (styleMatch) {
          const styleContent = styleMatch[1];
          bgColorMatch = styleContent.match(/background-color:\s*([^;]+)/);
          textColorMatch = styleContent.match(/color:\s*([^;]+)/);
        }

        // If only text color (no background), treat as textColor mark
        if (textColorMatch && !bgColorMatch) {
          return {
            type: 'textColor',
            attrs: { color: textColorMatch[1].trim() }
          };
        }

        // Has background color, treat as highlight
        const highlightAttrs: { color: string; textColor?: string; class?: string } = {
          color: bgColorMatch ? bgColorMatch[1].trim() : 'var(--tt-color-highlight-yellow)'
        };

        if (textColorMatch) {
          highlightAttrs.textColor = textColorMatch[1].trim();
        }

        if (classMatch) {
          highlightAttrs.class = classMatch[1];
        }

        return { type: 'highlight', attrs: highlightAttrs };
      case 'a':
        const hrefMatch = attrs.match(/href=["']([^"']+)["']/);
        if (hrefMatch) {
          return {
            type: 'link',
            attrs: { href: hrefMatch[1], target: '_blank', rel: 'noopener noreferrer nofollow', class: null }
          };
        }
        return null;
      case 'sup':
        return { type: 'superscript' };
      case 'sub':
        return { type: 'subscript' };
      case 'span':
        const spanStyleMatch = attrs.match(/style=["']([^"']+)["']/);
        if (spanStyleMatch) {
          const spanColor = spanStyleMatch[1].match(/color:\s*([^;]+)/)?.[1];
          if (spanColor) {
            return {
              type: 'textColor',
              attrs: { color: spanColor.trim() }
            };
          }
        }
        return null;
      default:
        return null;
    }
  };

  while ((match = tagPattern.exec(html)) !== null) {
    // Add text before tag
    if (match.index > lastIndex) {
      const text = html.substring(lastIndex, match.index);
      if (text) {
        const node: TipTapTextNode = { type: 'text', text };
        if (markStack.length > 0) {
          node.marks = [...markStack];
        }
        nodes.push(node);
      }
    }

    const isClosing = match[1] === '/';
    const tagName = match[2];
    const attrs = match[3];

    if (!isClosing) {
      const mark = tagToMark(tagName, attrs);
      if (mark) {
        markStack.push(mark);
      }
    } else {
      // Find and remove the corresponding opening mark
      const mark = tagToMark(tagName, '');
      if (mark) {
        const index = markStack.findIndex(m => m.type === mark.type);
        if (index !== -1) {
          markStack.splice(index, 1);
        }
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < html.length) {
    const text = html.substring(lastIndex);
    if (text) {
      const node: TipTapTextNode = { type: 'text', text };
      if (markStack.length > 0) {
        node.marks = [...markStack];
      }
      nodes.push(node);
    }
  }

  return nodes;
}

function areMarksEqual(marks1: TipTapMark[], marks2: TipTapMark[]): boolean {
  if (marks1.length !== marks2.length) return false;

  const sorted1 = [...marks1].sort((a, b) => a.type.localeCompare(b.type));
  const sorted2 = [...marks2].sort((a, b) => a.type.localeCompare(b.type));

  return sorted1.every((mark, i) => {
    const otherMark = sorted2[i];
    return mark.type === otherMark.type &&
           JSON.stringify(mark.attrs || {}) === JSON.stringify(otherMark.attrs || {});
  });
}

/**
 * Converts TipTap text nodes with marks back to HTML string for EditorJS
 *
 * @example
 * convertTipTapNodesToHTML([
 *   { type: 'text', text: 'Hello ' },
 *   { type: 'text', text: 'world', marks: [{ type: 'bold' }] }
 * ])
 * // Returns: 'Hello <b>world</b>'
 */
export function convertTipTapNodesToHTML(nodes: TipTapTextNode[]): string {
  if (!nodes || nodes.length === 0) return '';

  return nodes.map(node => {
    let text = node.text || '';
    const marks = node.marks || [];

    // Apply marks in reverse order (innermost first)
    // Sort marks to ensure consistent nesting order
    const sortedMarks = [...marks].sort((a, b) => {
      const order = ['link', 'highlight', 'textColor', 'code', 'bold', 'italic', 'underline', 'strike', 'superscript', 'subscript'];
      return order.indexOf(a.type) - order.indexOf(b.type);
    });

    sortedMarks.forEach(mark => {
      switch (mark.type) {
        case 'bold':
          text = `<b>${text}</b>`;
          break;
        case 'italic':
          text = `<i>${text}</i>`;
          break;
        case 'underline':
          text = `<u>${text}</u>`;
          break;
        case 'strike':
          text = `<s>${text}</s>`;
          break;
        case 'code':
          text = `<code>${text}</code>`;
          break;
        case 'highlight':
          const bgColor = mark.attrs?.color || 'var(--tt-color-highlight-yellow)';
          const textColor = mark.attrs?.textColor;
          const className = mark.attrs?.class;

          const styleAttr = textColor
            ? `background-color: ${bgColor}; color: ${textColor}`
            : `background-color: ${bgColor}`;

          const classAttr = className ? ` class="${className}"` : '';

          text = `<mark style="${styleAttr}"${classAttr}>${text}</mark>`;
          break;
        case 'link':
          const href = mark.attrs?.href || '#';
          const target = mark.attrs?.target || '_blank';
          text = `<a href="${href}" target="${target}">${text}</a>`;
          break;
        case 'superscript':
          text = `<sup>${text}</sup>`;
          break;
        case 'subscript':
          text = `<sub>${text}</sub>`;
          break;
        case 'textColor':
          const color = mark.attrs?.color || '#000000';
          text = `<span style="color: ${color}">${text}</span>`;
          break;
      }
    });

    return text;
  }).join('');
}
