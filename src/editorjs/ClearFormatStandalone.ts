import type { InlineTool } from '@editorjs/editorjs';

/**
 * Inline tool «Очистить форматирование» for EditorJS.
 *
 * Self-contained: depends only on rangy being present on `window`
 * (rangy-core + rangy-selectionsaverestore, loaded via <script> in index.html).
 * Strips inline formatting tags from the current selection while keeping links.
 */

// Minimal shape of the rangy API we use. Declared locally (not as a global
// Window augmentation) so this file drops into any project without clashing
// with an existing rangy typings file.
interface RangyRange {
  toString(): string;
  splitBoundaries(): void;
  getNodes(nodeTypes?: number[]): Node[];
}
interface RangySelection {
  rangeCount: number;
  getRangeAt(index: number): RangyRange;
}
interface Rangy {
  getSelection(): RangySelection | null;
  saveSelection(): unknown;
  restoreSelection(saved: unknown): void;
  removeMarkers(saved: unknown): void;
}

function getRangy(): Rangy | undefined {
  return (window as unknown as { rangy?: Rangy }).rangy;
}

/** Inline formatting tags to unwrap. `<a>` is intentionally excluded. */
const TAGS_TO_REMOVE = new Set([
  'B', 'STRONG', 'I', 'EM', 'MARK', 'U', 'CODE', 'S', 'DEL', 'INS', 'SUB', 'SUP',
]);

export default class ClearFormatStandalone implements InlineTool {
  public static isInline = true;
  public static title = 'Очистить форматирование';
  public static shortcut = 'CMD+\\';

  private button: HTMLButtonElement | null = null;
  private readonly icon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M16 6l3 3m-1.5-1.5L9 16l-3 1 1-3 8.5-8.5z"/><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M10 14l-4 4m8-12L6 14"/></svg>';

  public render(): HTMLElement {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.classList.add('ce-inline-tool');
    this.button.innerHTML = this.icon;
    this.button.title = ClearFormatStandalone.title;
    return this.button;
  }

  public surround(range: Range | null): void {
    const rangy = getRangy();
    if (!rangy) {
      // rangy not loaded — nothing we can do reliably
      return;
    }

    // Make sure rangy reads the range EditorJS handed us.
    if (range && !range.collapsed) {
      const nativeSel = window.getSelection();
      nativeSel?.removeAllRanges();
      nativeSel?.addRange(range);
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
    const toUnwrap = new Set<HTMLElement>();

    for (const textNode of textNodes) {
      let parent: Node | null = textNode.parentNode;

      while (parent && parent.nodeType === Node.ELEMENT_NODE) {
        const el = parent as HTMLElement;

        // Stop at the block-level editable element.
        if (el.tagName === 'DIV' || el.classList.contains('ce-paragraph')) {
          break;
        }
        // Keep links intact.
        if (el.tagName !== 'A' && TAGS_TO_REMOVE.has(el.tagName)) {
          toUnwrap.add(el);
        }
        parent = el.parentNode;
      }
    }

    toUnwrap.forEach((el) => ClearFormatStandalone.unwrap(el));

    // Restore the user's selection and clean up rangy's marker nodes.
    rangy.restoreSelection(saved);
    rangy.removeMarkers(saved);
  }

  /** Move an element's children up to its parent and drop the element. */
  private static unwrap(element: HTMLElement): void {
    const parent = element.parentNode;
    if (!parent) return;

    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
  }

  public checkState(): boolean {
    return false; // never rendered as "active"
  }

  public static get sanitize() {
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
