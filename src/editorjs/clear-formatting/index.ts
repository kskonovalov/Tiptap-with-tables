/**
 * Import utils
 */
import { SelectionUtils } from './utils/selection';
// awaiting PR to be merged: https://github.com/codex-team/icons/pull/42
//import { IconClearFormatting } from '@codexteam/icons';

/**
 * Import styles
 */
import './index.css';

// Minimal EditorJS inline-tool API types — no external deps required
interface EditorAPI {
  i18n: { t(key: string): string };
  styles: { inlineToolButton: string; inlineToolButtonActive: string };
  inlineToolbar: { close(): void };
}

interface ClearFormattingConfig {
  /** Горячая клавиша для вызова инструмента */
  shortcut?: string | null;
  /** Закрывать inline toolbar сразу после нажатия */
  closeOnClick?: boolean;
  /** HTML-иконка кнопки */
  icon?: string;
}

interface InlineToolConstructorOptions {
  api: EditorAPI;
  config?: ClearFormattingConfig;
}

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
   */
  private config: Required<ClearFormattingConfig> = {
    shortcut: null,
    closeOnClick: false,
    // for as long there is no icon for this tool in codex/icons, we will use the following svg
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.7,7h3.1M17.1,9l.7-1.8c0-.1,0-.2-.1-.2h-3.8M11.1,14.6l-.9,2.4M13.8,7l-.7,2M10.2,17h-2M10.2,17h2"/><line x1="7" x2="17.8" y1="7" y2="17" stroke="currentColor" stroke-linecap="round" stroke-width="2"/></svg>',
  };

  private api: EditorAPI;

  /**
   * State of the tool
   */
  private state = false;

  /**
   * block in which the selection is made — set when checkState is called
   */
  private block: HTMLElement | null = null;

  private button: HTMLButtonElement | null = null;

  /**
   * Specifies Tool as Inline Toolbar Tool
   */
  static get isInline(): boolean {
    return true;
  }

  /**
   * Sanitizer Rule
   */
  static get sanitize(): undefined {
    // this tool does not create any HTML element, so no need to sanitize
    return undefined;
  }

  /**
   * Title for hover-tooltip
   */
  get title(): string {
    return this.api.i18n.t(DICTIONARY.clearFormatting);
  }

  /**
   * Set a shortcut
   */
  get shortcut(): string | undefined {
    return this.config.shortcut ?? undefined;
  }

  /**
   * Initialize basic data
   *
   * @param options - tools constructor params
   * @param options.config — initial config for the tool
   * @param options.api — methods from Core
   */
  constructor({ config, api }: InlineToolConstructorOptions) {
    this.api = api;
    this.config = { ...this.config, ...config };

    // keep `this` bound so it can be used as an event listener
    this.updateState = this.updateState.bind(this);
  }

  /**
   * Create element with buttons for toolbar
   */
  render(): HTMLButtonElement {
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
   * @param range — selected range
   */
  surround(range: Range | null): void {
    if (!range) {
      return;
    }

    // needs improvement to handle a partial selection within an inline tag
    // we will need to implement something like rangy.splitBoundaries()
    SelectionUtils.clearFormatting(this.block);

    if (this.config.closeOnClick) {
      this.api.inlineToolbar.close();
    }
  }

  /**
   * Check for a tool's state
   *
   * @param selection — selection to be passed from Core
   */
  checkState(selection: Selection): void {
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
   */
  updateState(): void {
    if (this.api === undefined || this.button === null) return;

    this.state = SelectionUtils.hasFormatting(this.block);

    // disable/enable button based on the state
    this.button.disabled = !this.state;

    this.button.classList.toggle(this.api.styles.inlineToolButtonActive, this.state);
  }

  /**
   * Function called with Inline Toolbar closing
   */
  clear(): void {
    if (this.block) {
      this.block.removeEventListener('input', this.updateState);
    }
  }
}
