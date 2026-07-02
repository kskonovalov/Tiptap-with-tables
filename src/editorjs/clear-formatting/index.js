/**
 * Import utils
 */
import { SelectionUtils } from './utils/selection.js';
// awaiting PR to be merged: https://github.com/codex-team/icons/pull/42
//import { IconClearFormatting } from '@codexteam/icons';

/**
 * Import styles
 */
import './index.css';

const DICTIONARY = {
  clearFormatting: 'Очистить форматирование',
};

/**
 * Clear Formatting Inline Tool for EditorJS
 *
 * Добавляет кнопку «Очистить форматирование» в inline toolbar,
 * которая появляется при выделении текста и снимает всё форматирование
 * с выделенного фрагмента.
 */
export default class ClearFormatting {

  /**
   * Default configuration
   * @param {object} config
   */
  config = {
    shortcut: null,
    closeOnClick: false,
    // for as long there is no icon for this tool in codex/icons, we will use the following svg
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.7,7h3.1M17.1,9l.7-1.8c0-.1,0-.2-.1-.2h-3.8M11.1,14.6l-.9,2.4M13.8,7l-.7,2M10.2,17h-2M10.2,17h2"/><line x1="7" x2="17.8" y1="7" y2="17" stroke="currentColor" stroke-linecap="round" stroke-width="2"/></svg>',
  }

  /**
   * State of the tool
   * @type {boolean}
   */
  state = false;

  /**
   * block in which the selection is made
   * will be set when checkState is called
   * @type {HTMLElement}
   */
  block = null;

  /**
   * Specifies Tool as Inline Toolbar Tool
   * @returns {boolean}
   */
  static get isInline() {
    return true;
  }

  /**
   * Sanitizer Rule
   * @returns {object}
   */
  static get sanitize() {
    // this tool does not create any HTML element, so no need to sanitize
  }

  /**
   * Title for hover-tooltip
   * @returns {string}
   */
  get title() {
    return this.api.i18n.t(DICTIONARY.clearFormatting);
  }

  /**
   * Set a shortcut
   * @returns {string}
   */
  get shortcut() {
    if (this.config.shortcut !== null) {
      return this.config.shortcut;
    }
  }

  /**
   * Initialize basic data
   *
   * @param {object} options - tools constructor params
   * @param {object} options.config — initial config for the tool
   * @param {object} options.api — methods from Core
   */
  constructor({ config, api }) {
    this.api = api;
    this.config = { ...this.config, ...config };

    // keep `this` bound so it can be used as an event listener
    this.updateState = this.updateState.bind(this);
  }

  /**
   * Create element with buttons for toolbar
   *
   * @returns {HTMLButtonElement}
   */
  render() {
    /**
     * Create wrapper for buttons
     * @type {HTMLButtonElement}
     */
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.innerHTML = this.config.icon;
    this.button.classList.add(this.api.styles.inlineToolButton);

    return this.button;
  }

  /**
   * Handle clicks on the Inline Toolbar icon
   * Снимает форматирование с выделенного текста
   *
   * @param {Range} range — selected range
   * @returns {void}
   */
  surround(range) {
    if (!range) {
      return;
    }

    // needs improvement to handle selection within inline tag
    // we will need to implement something like rangy.splitBoundaries()
    SelectionUtils.clearFormatting();

    if (this.config.closeOnClick) {
      this.api.inlineToolbar.close();
    }
  }

  /**
   * Check for a tool's state
   *
   * @param {Selection} selection — selection to be passed from Core
   * @returns {void}
   */
  checkState(selection) {
    // get the parent div with class cdx-block in which the selection is made. This is the block node
    this.block = SelectionUtils.findBlock(selection);

    this.updateState();

    // listen for changes in the block contents
    if (this.block) {
      this.block.addEventListener('input', this.updateState);
    }
  }

  /**
   * Update the state of the tool
   * @returns {void}
   */
  updateState() {
    // for some reason this.api is sometimes undefined, so we need to check for it to prevent errors
    // TODO: need to do further investigation to find out why this is happening
    if (this.api === undefined || this.button === undefined) return;

    this.state = SelectionUtils.hasFormatting(this.block);

    // disable/enable button based on the state
    this.button.disabled = !this.state;

    this.button.classList.toggle(this.api.styles.inlineToolButtonActive, this.state);
  }

  /**
   * Function called with Inline Toolbar closing
   * @returns {void}
   */
  clear() {
    if (this.block) {
      this.block.removeEventListener('input', this.updateState);
    }
  }
}
