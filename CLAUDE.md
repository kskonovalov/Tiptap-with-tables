# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Usage context

This repo is a **reference implementation**, not a production app. The user ports changes from here into a separate codebase — code is not deployed from this repo directly. When making changes:
- Keep implementations self-contained and portable (avoid tight coupling to demo scaffolding in `App.tsx`).
- Prefer patterns that are easy to extract and transplant: isolated components, clear extension boundaries, minimal side-effects in module init.

## EditorJS status

**EditorJS is not a dependency of this project** and is not installed. What lives here:

- `src/migrator/` — bidirectional JSON converter (EditorJS ↔ Tiptap). No EditorJS runtime needed; it operates on plain data objects.
- `src/editorjs/` — contains `CopyToTiptapTune`, an EditorJS block-tune plugin **meant to be copied into the user's EditorJS project**, not used here. Import it from there, not as a runtime dep here.

When working on the migrator, test it with plain JS objects matching the EditorJS block schema — no EditorJS instance required.

## Commands

```bash
npm run dev        # start Vite dev server (HMR)
npm run build      # tsc -b && vite build
npm run lint       # ESLint
npm run preview    # preview production build
```

There is no test framework configured.

## Architecture

This is a **React 19 + TypeScript + Vite** app built around **Tiptap v3** as a rich-text editor. The single entry point is `src/App.tsx` → `SimpleEditor` (`src/components/tiptap-templates/simple/simple-editor.tsx`), which wires together all extensions, the toolbar, and the editor canvas.

### Component layers (`src/components/`)

| Directory | Purpose |
|---|---|
| `tiptap-ui-primitive/` | Base design-system primitives: `Button`, `Toolbar`, `DropdownMenu`, `Popover`, `Input`, `Badge`, `Card`, `Tooltip`, `Separator`, `Spacer`. Each has its own `.scss`. |
| `tiptap-icons/` | Thin SVG icon components (no external icon library). |
| `tiptap-node/` | Custom Tiptap nodes. Each subdirectory contains an extension file (`*-extension.ts`), a React view component (`.tsx`), and scoped styles (`.scss`). |
| `tiptap-extension/` | Extensions that don't define a new node type: `UniqueID` (auto-assigns UUIDs to all block nodes; custom implementation replacing `@tiptap/extension-unique-id`), `NodeBackground`. |
| `tiptap-ui/` | Toolbar UI components. Each subdirectory exposes: a `use-*.ts` hook that encapsulates editor state logic, a `*-button.tsx` or `*-dropdown-menu.tsx` rendering component, and an `index.tsx` re-export. |
| `tiptap-templates/simple/` | The assembled editor template: `SimpleEditor`, `MainToolbarContent`, `MobileToolbarContent`, `ThemeToggle`. Contains the paste normalization logic for spreadsheet HTML (LibreOffice/Excel). |

### Custom node pattern

Every node in `tiptap-node/` follows this shape:
- `*-extension.ts` — defines the Tiptap `Node.create(...)` extension
- `index.tsx` — exports the extension and (if a React node view is needed) the React component
- `*.scss` — scoped CSS for that node

To add a new node: create the extension, register it in the `extensions` array inside `SimpleEditor`, and import its CSS there too.

### Toolbar UI pattern

Every toolbar control in `tiptap-ui/` follows this shape:
- `use-*.ts` — reads editor state via `useCurrentEditor()` and exposes `isActive`, `isDisabled`, handlers
- `*-button.tsx` / `*-dropdown-menu.tsx` — pure presentational component consuming the hook
- `index.tsx` — re-exports

### EditorJS ↔ Tiptap migrator (`src/migrator/`)

Bidirectional converter between EditorJS JSON and Tiptap JSON:
- `editorjsToTiptap(data)` — converts EditorJS blocks → Tiptap `doc`
- `tiptapToEditorjs(doc, options?)` — converts Tiptap `doc` → EditorJS blocks
- Block type handlers live in `converters/` (one file per block type)
- Block IDs are preserved round-trip via `injectBlockId` / `preserveBlockId`
- `options.paragraphBlockType` controls whether paragraphs serialize as `"paragraph"` or `"customParagraph"`

### Shared hooks (`src/hooks/`)

- `use-tiptap-editor.ts` — `useCurrentEditor()` wrapper
- `use-responsive-toolbar.ts` — splits toolbar items into visible/hidden based on container width
- `use-cursor-visibility.ts` — keeps the cursor above the floating mobile toolbar
- `use-is-breakpoint.ts`, `use-window-size.ts` — viewport utilities
- `use-throttled-callback.ts`, `use-scrolling.ts`, `use-element-rect.ts`, `use-menu-navigation.ts`

### Key utilities (`src/lib/tiptap-utils.ts`)

- `sanitizeContent(doc, extensions)` — validates each top-level block against the ProseMirror schema; invalid blocks are replaced with `errorBlock` placeholders (prevents a single broken block from crashing the editor)
- `sanitizeUrl(url, base)` — allow-list URL validator
- `handleImageUpload` / `handleFileUpload` — stub upload handlers (replace with real endpoints)
- `isMarkInSchema`, `isNodeInSchema`, `isExtensionAvailable` — schema introspection helpers
- `getSelectedNodesOfType`, `selectionWithinConvertibleTypes` — selection utilities

### Styling

- SCSS (via `sass-embedded`); no CSS-in-JS
- Global variables in `src/styles/_variables.scss`, keyframe animations in `src/styles/_keyframe-animations.scss`
- Node/component styles are colocated with their source files
- Light/dark theme toggled by `ThemeToggle` (adds a class to `<html>`)
