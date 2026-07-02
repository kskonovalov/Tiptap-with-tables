/**
 * Inline tool «Очистить форматирование» for EditorJS (plain JavaScript).
 *
 * Self-contained: depends only on rangy being present on `window`
 * (rangy-core + rangy-selectionsaverestore, loaded via <script> in index.html).
 * Strips inline formatting tags from the current selection while keeping links.
 */

/** Inline formatting tags to unwrap. `<a>` is intentionally excluded. */
const TAGS_TO_REMOVE = new Set([
  'B', 'STRONG', 'I', 'EM', 'MARK', 'U', 'CODE', 'S', 'DEL', 'INS', 'SUB', 'SUP',
]);

export default class ClearFormatStandalone {
  static isInline = true;
  static title = 'Очистить форматирование';
  static shortcut = 'CMD+\\';

  constructor() {
    this.button = null;
    this.icon =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M16 6l3 3m-1.5-1.5L9 16l-3 1 1-3 8.5-8.5z"/><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M10 14l-4 4m8-12L6 14"/></svg>';
  }

  render() {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.classList.add('ce-inline-tool');
    this.button.innerHTML = this.icon;
    this.button.title = ClearFormatStandalone.title;
    return this.button;
  }

  surround(range) {
    const rangy = window.rangy;
    if (!rangy) {
      return;
    }

    // Make sure rangy reads the range EditorJS handed us.
    if (range && !range.collapsed) {
      const nativeSel = window.getSelection();
      if (nativeSel) {
        nativeSel.removeAllRanges();
        nativeSel.addRange(range);
      }
    }

    const sel = rangy.getSelection();
    if (!sel || sel.rangeCount === 0) {
      return;
    }

    const rangyRange = sel.getRangeAt(0);
    if (!rangyRange || rangyRange.toString() === '') {
      return;
    }

    // Split text nodes at the selection boundaries, then collect every text
    // node inside the selection.
    rangyRange.splitBoundaries();

    // Preserve the selection across the coming DOM mutations.
    const saved = rangy.saveSelection();

    const textNodes = rangyRange.getNodes([Node.TEXT_NODE]);

    // Gather the inline wrappers to unwrap: walk up from each text node to the
    // block boundary, collecting formatting tags and skipping links.
    const toUnwrap = new Set();

    for (const textNode of textNodes) {
      let parent = textNode.parentNode;

      while (parent && parent.nodeType === Node.ELEMENT_NODE) {
        // Stop at the block-level editable element.
        if (parent.tagName === 'DIV' || parent.classList.contains('ce-paragraph')) {
          break;
        }
        // Keep links intact.
        if (parent.tagName !== 'A' && TAGS_TO_REMOVE.has(parent.tagName)) {
          toUnwrap.add(parent);
        }
        parent = parent.parentNode;
      }
    }

    toUnwrap.forEach((el) => ClearFormatStandalone.unwrap(el));

    // Restore the user's selection and clean up rangy's marker nodes.
    rangy.restoreSelection(saved);
    rangy.removeMarkers(saved);
  }

  /** Move an element's children up to its parent and drop the element. */
  static unwrap(element) {
    const parent = element.parentNode;
    if (!parent) return;

    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
  }

  checkState() {
    return false; // never rendered as "active"
  }

  static get sanitize() {
    return {
      b: {},
      strong: {},
      i: {},
      em: {},
      mark: {},
      u: {},
      code: {},
      s: {},
      del: {},
      ins: {},
      sub: {},
      sup: {},
      a: { href: true, target: '_blank', rel: 'nofollow' },
    };
  }
}
