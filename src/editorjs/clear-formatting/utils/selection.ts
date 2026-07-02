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
   * TODO:
   *  - expand selection to include the inline tag if the contents of the inline tag equals that of the selection (use case when new formatting was applied to the selection before clearing formatting)
   *  - needs improvement to handle selection within inline tag:
   *    For example, when clearing formatting of 'on this': "some <b>emphasis on this text</b> and some more text" should become "some <b>emphasis</b> on this <b>text</b> and some more text"
   */
  static clearFormatting(): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);

    // Create a new Range to clone the contents, so we don't modify the document yet
    const cloneRange = range.cloneRange();
    const selectedText = cloneRange.extractContents();

    // Strip all HTML elements from the selected text
    const textContent = selectedText.textContent ?? '';

    // Create a text node with the stripped text
    const textNode = document.createTextNode(textContent);

    // Replace the selected text with the text node in the original Range
    range.deleteContents();
    range.insertNode(textNode);

    // Restore selection
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * Find the block node in which the selection is made
   */
  static findBlock(selection: Selection): HTMLElement | null {
    const node = selection.anchorNode;
    if (!node) return null;

    return node.nodeType === Node.TEXT_NODE
      ? (node.parentElement?.closest('.cdx-block') ?? null)
      : (node as HTMLElement).closest('.cdx-block');
  }
}
