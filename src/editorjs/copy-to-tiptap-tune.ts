// Minimal EditorJS API types — no external deps required
interface BlockAPI {
  save(): Promise<{ id?: string; type: string; data: Record<string, unknown> }>;
}

interface EditorAPI {
  // intentionally minimal — add fields as needed
  [key: string]: unknown;
}

interface TuneConstructorOptions {
  api: EditorAPI;
  block: BlockAPI;
}

export const TIPTAP_CLIPBOARD_PREFIX = 'editorjs-tiptap::';

export class CopyToTiptapTune {
  static get isTune() {
    return true;
  }

  private block: BlockAPI;
  private button: HTMLButtonElement | null = null;

  constructor({ block }: TuneConstructorOptions) {
    this.block = block;
  }

  render(): HTMLElement {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.classList.add('ce-settings__button');
    this.button.textContent = 'Копировать для Tiptap';

    this.button.addEventListener('click', () => this.handleClick());

    return this.button;
  }

  private async handleClick(): Promise<void> {
    if (!this.button) return;

    try {
      const blockData = await this.block.save();
      const payload = JSON.stringify({ blocks: [blockData] });
      await navigator.clipboard.writeText(TIPTAP_CLIPBOARD_PREFIX + payload);
      this.showFeedback('Скопировано ✓');
    } catch {
      this.showFeedback('Ошибка ✗');
    }
  }

  private showFeedback(text: string): void {
    if (!this.button) return;
    const original = this.button.textContent;
    this.button.textContent = text;
    this.button.disabled = true;
    setTimeout(() => {
      if (!this.button) return;
      this.button.textContent = original;
      this.button.disabled = false;
    }, 1500);
  }

  // Required by EditorJS tune contract (called when block data is saved)
  save(blockData: Record<string, unknown>): Record<string, unknown> {
    return blockData;
  }
}
