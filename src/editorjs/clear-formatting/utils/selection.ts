/**
 * Useful functions
 */
export class SelectionUtils {
  /**
   * Check if the selection has formatting
   *
   * @param context — block element the selection lives in
   */
  static hasFormatting(context: HTMLElement | null): boolean {
    if (context === undefined || context === null) return false;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false; // No selection

    // Check if the selection includes inline tags
    const range = sel.getRangeAt(0);

    // Check if the selection contains a html tag (opening, close or both)
    if (range.cloneContents().children.length) {
      return true;
    }

    // check if the selection is within an inline tag (i.e. the inline tag is the parent of the selection and not context)
    let node: Node | null = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }
    if (node !== context) {
      return true;
    }

    return false;
  }

  /**
   * Clear formatting from the selected text
   *
   * @param context — the editable block element (the `contenteditable` node).
   *   Used as the boundary up to which inline wrappers may be unwrapped; the
   *   element itself is never removed.
   *
   * TODO:
   *  - needs improvement to handle a *partial* selection within an inline tag:
   *    clearing 'on this' in "some <b>emphasis on this text</b> and more" should
   *    yield "some <b>emphasis</b> on this <b>text</b> and more". Currently a
   *    partial selection inside a single wrapper is left wrapped.
   */
  static clearFormatting(context: HTMLElement | null): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    if (range.collapsed) return;

    // Plain text of the selection — non-destructive and strips every tag.
    // (The previous cloneRange().extractContents() actually mutated the DOM.)
    const text = range.toString();
    const textNode = document.createTextNode(text);

    // Replace the selected content with the plain text node
    range.deleteContents();
    range.insertNode(textNode);

    // If the selection covered the *entire* content of one or more inline
    // wrappers (e.g. a <span>/<b> around the whole text, or a whole heading),
    // the text node now sits *inside* those wrappers and the formatting element
    // survives. Unwrap every ancestor between the text node and the editable
    // block whose text is exactly our inserted text.
    //
    // We compare by `textContent` rather than child count on purpose:
    // `deleteContents()` + `insertNode()` leave behind empty text nodes (a
    // selection inside a single text node gets split), so the wrapper often has
    // more than one child even when our text is its only real content.
    let wrapper = textNode.parentElement;
    while (wrapper !== null && wrapper !== context && wrapper.textContent === text) {
      wrapper.replaceWith(textNode);
      wrapper = textNode.parentElement;
    }

    // Remove inline wrappers that `deleteContents()` emptied but left in place
    // (e.g. the second of two partially-selected spans). Scoped to the current
    // block so we don't touch unrelated content.
    if (context) {
      context
        .querySelectorAll('span, b, strong, i, em, u, s, mark, a, font')
        .forEach((el) => {
          if (el.textContent === '') el.remove();
        });
    }

    // Restore selection over the inserted text
    sel.removeAllRanges();
    const restored = document.createRange();
    restored.selectNode(textNode);
    sel.addRange(restored);
  }

  /**
   * Find the editable container in which the selection is made.
   *
   * We look for the nearest `contenteditable` element rather than the
   * `.cdx-block` class: that class is added only by the Paragraph tool, while
   * Header (and other tools) render their own editable element without it, so
   * `.cdx-block` leaves the tool disabled on headings. The editable element is
   * also the correct `context` for `hasFormatting` and the boundary for
   * `clearFormatting`, since it is the direct parent of the block's text.
   */
  static findBlock(selection: Selection): HTMLElement | null {
    const node = selection.anchorNode;
    if (!node) return null;

    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement);

    return el?.closest<HTMLElement>('[contenteditable="true"]') ?? null;
  }
}
