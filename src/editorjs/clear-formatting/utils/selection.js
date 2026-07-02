/**
 * Useful functions
 */
export class SelectionUtils {
  /**
   * Check if the selection has formatting
   *
   * @param {HTMLElement} context — block element the selection lives in
   * @returns {boolean}
   */
  static hasFormatting(context) {
    if (context === undefined || context === null) return false;

    let sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false; // No selection

    // Check if the selection includes inline tags
    let range = sel.getRangeAt(0);

    // Check if the selection contains a html tag (opening, close or both)
    if (range.cloneContents().children.length) {
      return true;
    }

    // check if the selection is within an inline tag (i.e. the inline tag is the parent of the selection and not context)
    let node = range.commonAncestorContainer;
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
   * @returns {void}
   */
  static clearFormatting() {
    let sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    let range = sel.getRangeAt(0);

    // Create a new Range to clone the contents, so we don't modify the document yet
    let cloneRange = range.cloneRange();
    let selectedText = cloneRange.extractContents();

    // Strip all HTML elements from the selected text
    let textContent = selectedText.textContent;

    // Create a text node with the stripped text
    let textNode = document.createTextNode(textContent);

    // Replace the selected text with the text node in the original Range
    range.deleteContents();
    range.insertNode(textNode);

    // Restore selection
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * Find the block node in which the selection is made
   * @param {Selection} selection
   * @returns {Node}
   */
  static findBlock(selection) {
    let node = selection.anchorNode;
    if (!node) return null;

    return node.nodeType === Node.TEXT_NODE
      ? node.parentElement.closest('.cdx-block')
      : node.closest('.cdx-block');
  }
}
