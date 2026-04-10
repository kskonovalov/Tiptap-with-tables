"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { DOMParser as PMDOMParser } from "@tiptap/pm/model";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Selection } from "@tiptap/extensions";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import {
  Details,
  DetailsContent,
  DetailsSummary,
} from "@tiptap/extension-details";

// --- UI Primitives ---
import { Button } from "../../tiptap-ui-primitive/button/index";
import { Spacer } from "../../tiptap-ui-primitive/spacer/index";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "../../tiptap-ui-primitive/toolbar/index";

// --- Tiptap Node ---
import { ImageUploadNode, pendingUploadFiles } from "../../tiptap-node/image-upload-node/image-upload-node-extension";
import { HorizontalRule } from "../../tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import { CustomOrderedList } from "../../tiptap-node/ordered-list-node/ordered-list-node-extension";
import { CustomBulletList } from "../../tiptap-node/bullet-list-node/bullet-list-node-extension";
import { CustomTaskList } from "../../tiptap-node/task-list-node/task-list-node-extension";
import { AlertNode } from "../../tiptap-node/alert-node/index";
import { ErrorBlockNode } from "../../tiptap-node/error-block-node/index";
import {
  WarningNode,
  WarningTitle,
  WarningMessage,
} from "../../tiptap-node/warning-node/index";
import { ColumnsNode, ColumnItem } from "../../tiptap-node/columns-node/index";
import { Color, TextStyle } from "../../tiptap-node/color-node/index";
import { FontSize } from "../../tiptap-node/fontsize-node/index";
import { FontFamily } from "../../tiptap-node/fontfamily-node/index";
import { NodeBackground } from "../../tiptap-extension/node-background-extension";
import { TableFilter } from "../../tiptap-node/table-filter-node/index";
import { TableRowFilter } from "../../tiptap-node/table-row-filter-node/index";
import "../../tiptap-node/alert-node/alert-node.scss";
import "../../tiptap-node/error-block-node/error-block-node.scss";
import "../../tiptap-node/warning-node/warning-node.scss";
import "../../tiptap-node/columns-node/columns-node.scss";
import "../../tiptap-node/table-node/table-node.scss";
import "../../tiptap-node/table-filter-node/table-filter.scss";

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "../../tiptap-ui/heading-dropdown-menu/index";
import { ImageUploadButton } from "../../tiptap-ui/image-upload-button/index";
import { ListDropdownMenu } from "../../tiptap-ui/list-dropdown-menu/index";
import { BlockquoteButton } from "../../tiptap-ui/blockquote-button/index";
import { CodeBlockButton } from "../../tiptap-ui/code-block-button/index";
import { DetailsButton } from "../../tiptap-ui/details-button/index";
import { AlertDropdownMenu } from "../../tiptap-ui/alert-dropdown-menu/index";
import { WarningButton } from "../../tiptap-ui/warning-button/index";
import { ColumnsDropdownMenu } from "../../tiptap-ui/columns-dropdown-menu/index";
import { ColorDropdownMenu } from "../../tiptap-ui/color-dropdown-menu/index";
import { FontSizeDropdownMenu } from "../../tiptap-ui/fontsize-dropdown-menu/index";
import { FontFamilyDropdownMenu } from "../../tiptap-ui/fontfamily-dropdown-menu/index";
import { TableButton } from "../../tiptap-ui/table-button/index";
import { TableActionsMenu } from "../../tiptap-ui/table-actions-menu/index";
import { BubbleMenu } from "../../tiptap-ui/bubble-menu/index";
import { ImageBubbleMenu } from "../../tiptap-ui/image-bubble-menu/index";
import { ToolsDropdownMenu } from "../../tiptap-ui/tools-dropdown-menu/index";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "../../tiptap-ui/color-highlight-popover/index";
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "../../tiptap-ui/link-popover/index";
import { MarkButton } from "../../tiptap-ui/mark-button/index";
import { TextAlignButton } from "../../tiptap-ui/text-align-button/index";
import { UndoRedoButton } from "../../tiptap-ui/undo-redo-button/index";

// --- Icons ---
import { ArrowLeftIcon } from "../../tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "../../tiptap-icons/highlighter-icon";
import { LinkIcon } from "../../tiptap-icons/link-icon";

// --- Hooks ---
import { useIsBreakpoint } from "../../../hooks/use-is-breakpoint";
import { useWindowSize } from "../../../hooks/use-window-size";
import { useCursorVisibility } from "../../../hooks/use-cursor-visibility";
import { useResponsiveToolbar } from "../../../hooks/use-responsive-toolbar";

// --- Components ---
import { ThemeToggle } from "./theme-toggle";

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE, sanitizeUrl, sanitizeContent } from "../../../lib/tiptap-utils";
import type { Extensions } from "@tiptap/core";

// --- Styles ---
import "./simple-editor.scss";

import content from "./data/content.json";

// ---------------------------------------------------------------------------
// Paste normalization — preserves spreadsheet formatting (LibreOffice, Excel)
// ---------------------------------------------------------------------------

/**
 * Wraps all current children of `parent` inside a newly created element.
 * Uses DOM node moves only — no innerHTML string injection.
 */
function wrapCellChildren(
  parent: HTMLElement,
  tagName: string,
  style?: string
): void {
  const wrapper = parent.ownerDocument.createElement(tagName);
  if (style) wrapper.setAttribute("style", style);
  while (parent.firstChild) wrapper.appendChild(parent.firstChild);
  parent.appendChild(wrapper);
}

/**
 * Parses CSS class rules from a <style> block text.
 * Returns a map of className → { property: value }.
 * Filters out mso-* vendor properties (Excel-internal, not valid CSS).
 */
function parseSpreadsheetClassStyles(
  cssText: string
): Map<string, Record<string, string>> {
  const map = new Map<string, Record<string, string>>();
  for (const m of cssText.matchAll(/\.(\w+)\s*\{([^}]+)\}/g)) {
    const props: Record<string, string> = {};
    for (const decl of m[2].split(";")) {
      const idx = decl.indexOf(":");
      if (idx === -1) continue;
      const prop = decl.slice(0, idx).trim();
      const value = decl.slice(idx + 1).trim();
      if (prop && value && !prop.startsWith("mso-")) {
        props[prop] = value;
      }
    }
    map.set(m[1], props);
  }
  return map;
}

// Valid CSS text-align values that Tiptap's TextAlign extension understands
const VALID_TEXT_ALIGN = new Set(["left", "right", "center", "justify"]);

/**
 * Normalizes HTML pasted from spreadsheet apps (LibreOffice, OpenOffice, Excel).
 * Returns the modified document body element for direct use with ProseMirror's DOMParser.
 *
 * - Resolves Excel CSS class-based styles to inline styles (when <style> block is present)
 * - Converts legacy HTML attributes (bgcolor, align) to inline styles
 * - Converts <font color="..."> to <span style="color:...">
 * - Moves text-formatting inline styles from <td>/<th> into proper wrapper elements
 *   so that Tiptap marks (Bold, Italic, Color, etc.) pick them up
 * - Strips layout-only attributes (height, width) that should not affect the editor
 */
function normalizePastedTableHTML(html: string): HTMLElement {
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Phase A — resolve Excel CSS class styles (only available with unsanitized HTML)
  const cssText = Array.from(doc.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n");

  if (cssText.trim()) {
    const classStyles = parseSpreadsheetClassStyles(cssText);
    doc.querySelectorAll<HTMLElement>("[class]").forEach((el) => {
      Array.from(el.classList).forEach((cls) => {
        const props = classStyles.get(cls);
        if (!props) return;
        for (const [prop, value] of Object.entries(props)) {
          if (!el.style.getPropertyValue(prop)) {
            el.style.setProperty(prop, value);
          }
        }
      });
    });
  }

  // Phase B — normalize <td>/<th> HTML attributes to inline styles
  doc.querySelectorAll<HTMLElement>("td, th").forEach((cell) => {
    const bgcolor = cell.getAttribute("bgcolor");
    if (bgcolor && !cell.style.backgroundColor) {
      cell.style.backgroundColor = bgcolor;
    }
    const align = cell.getAttribute("align");
    if (align && !cell.style.textAlign) {
      cell.style.textAlign = align;
    }
  });

  // Phase C — convert <font> elements to <span> with inline color
  doc.querySelectorAll<HTMLElement>("font").forEach((font) => {
    const color = font.style.color || font.getAttribute("color") || "";
    const span = doc.createElement("span");
    if (color && color !== "windowtext") {
      span.style.color = color;
    }
    while (font.firstChild) span.appendChild(font.firstChild);
    font.parentNode?.replaceChild(span, font);
  });

  // Phase D — move <td>/<th> inline styles into wrapper elements
  doc.querySelectorAll<HTMLElement>("td, th").forEach((cell) => {
    const s = cell.style;

    // Normalize background shorthand → background-color
    if (!s.backgroundColor && s.background) {
      s.backgroundColor = s.background;
      s.removeProperty("background");
    }

    // text-align → wrap in <p> so TextAlign mark applies to the paragraph
    // Only wrap for valid CSS values; Excel uses "general" which is not valid CSS
    if (s.textAlign && VALID_TEXT_ALIGN.has(s.textAlign)) {
      wrapCellChildren(cell, "p", `text-align:${s.textAlign}`);
    }

    // vertical-align: super / sub
    const va = s.verticalAlign;
    if (va === "super") wrapCellChildren(cell, "sup");
    else if (va === "sub") wrapCellChildren(cell, "sub");

    // font-size / font-family
    if (s.fontSize) wrapCellChildren(cell, "span", `font-size:${s.fontSize}`);
    if (s.fontFamily)
      wrapCellChildren(cell, "span", `font-family:${s.fontFamily}`);

    // text color (skip Excel placeholder 'windowtext')
    if (s.color && s.color !== "windowtext") {
      wrapCellChildren(cell, "span", `color:${s.color}`);
    }

    // text-decoration (can combine values, e.g. "underline line-through")
    const td = s.textDecoration;
    if (td?.includes("line-through")) wrapCellChildren(cell, "s");
    if (td?.includes("underline")) wrapCellChildren(cell, "u");

    // italic / bold
    if (s.fontStyle === "italic") wrapCellChildren(cell, "i");
    const fw = s.fontWeight;
    if (fw === "bold" || fw === "700" || fw === "600")
      wrapCellChildren(cell, "b");
  });

  // Phase E — strip height attributes/styles from table elements
  // (explicit row/cell heights cause visual distortion in the editor)
  doc.querySelectorAll<HTMLElement>("td, th, tr, col, colgroup").forEach(
    (el) => {
      el.removeAttribute("height");
      el.style.removeProperty("height");
      el.style.removeProperty("min-height");
      el.style.removeProperty("max-height");
    }
  );

  return doc.body;
}

// ---------------------------------------------------------------------------

interface ToolbarItem {
  element: React.ReactNode;
  estimatedWidth: number;
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
  toolbarRef,
}: {
  onHighlighterClick: () => void;
  onLinkClick: () => void;
  isMobile: boolean;
  toolbarRef: React.RefObject<HTMLDivElement | null>;
}) => {
  // Определяем все элементы toolbar (каждый элемент отдельно)
  const toolbarItems: ToolbarItem[] = [
    {
      element: <UndoRedoButton key="undo" action="undo" />,
      estimatedWidth: 32,
    },
    {
      element: <UndoRedoButton key="redo" action="redo" />,
      estimatedWidth: 32,
    },
    {
      element: (
        <HeadingDropdownMenu
          key="heading"
          levels={[1, 2, 3, 4]}
          portal={isMobile}
        />
      ),
      estimatedWidth: 50,
    },
    {
      element: (
        <ListDropdownMenu
          key="list"
          types={["bulletList", "orderedList", "taskList"]}
          portal={isMobile}
        />
      ),
      estimatedWidth: 50,
    },
    {
      element: <AlertDropdownMenu key="alert" portal={isMobile} />,
      estimatedWidth: 50,
    },
    {
      element: <ColumnsDropdownMenu key="columns" portal={isMobile} />,
      estimatedWidth: 50,
    },
    { element: <MarkButton key="bold" type="bold" />, estimatedWidth: 32 },
    { element: <MarkButton key="italic" type="italic" />, estimatedWidth: 32 },
    { element: <MarkButton key="strike" type="strike" />, estimatedWidth: 32 },
    { element: <MarkButton key="code" type="code" />, estimatedWidth: 32 },
    {
      element: <MarkButton key="underline" type="underline" />,
      estimatedWidth: 32,
    },
    {
      element: <ColorDropdownMenu key="color" portal={isMobile} />,
      estimatedWidth: 50,
    },
    {
      element: <FontSizeDropdownMenu key="fontsize" portal={isMobile} />,
      estimatedWidth: 50,
    },
    {
      element: <FontFamilyDropdownMenu key="fontfamily" portal={isMobile} />,
      estimatedWidth: 50,
    },
    {
      element: !isMobile ? (
        <ColorHighlightPopover key="highlight" />
      ) : (
        <ColorHighlightPopoverButton
          key="highlight"
          onClick={onHighlighterClick}
        />
      ),
      estimatedWidth: 32,
    },
    {
      element: !isMobile ? (
        <LinkPopover key="link" />
      ) : (
        <LinkButton key="link" onClick={onLinkClick} />
      ),
      estimatedWidth: 32,
    },
    {
      element: <MarkButton key="superscript" type="superscript" />,
      estimatedWidth: 32,
    },
    {
      element: <MarkButton key="subscript" type="subscript" />,
      estimatedWidth: 32,
    },
    {
      element: <TextAlignButton key="left" align="left" />,
      estimatedWidth: 32,
    },
    {
      element: <TextAlignButton key="center" align="center" />,
      estimatedWidth: 32,
    },
    {
      element: <TextAlignButton key="right" align="right" />,
      estimatedWidth: 32,
    },
    {
      element: <TextAlignButton key="justify" align="justify" />,
      estimatedWidth: 32,
    },
    { element: <TableButton key="table" />, estimatedWidth: 32 },
    {
      element: <TableActionsMenu key="table-actions" portal={isMobile} />,
      estimatedWidth: 50,
    },
    {
      element: <ImageUploadButton key="image" text="Add" />,
      estimatedWidth: 60,
    },
    { element: <BlockquoteButton key="blockquote" />, estimatedWidth: 32 },
    { element: <CodeBlockButton key="codeblock" />, estimatedWidth: 32 },
    { element: <DetailsButton key="details" />, estimatedWidth: 32 },
    { element: <WarningButton key="warning" />, estimatedWidth: 32 },
  ];

  const { visibleItems, hiddenItems } = useResponsiveToolbar({
    items: toolbarItems,
    containerRef: toolbarRef,
    overflowButtonWidth: 50,
  });

  return (
    <>
      <Spacer />

      {visibleItems.map((item: ToolbarItem, index: number) => (
        <React.Fragment key={index}>{item.element}</React.Fragment>
      ))}

      {hiddenItems.length > 0 && (
        <>
          <ToolbarSeparator />
          <ToolsDropdownMenu portal={isMobile}>
            {hiddenItems.map((item: ToolbarItem, index: number) => (
              <React.Fragment key={index}>{item.element}</React.Fragment>
            ))}
          </ToolsDropdownMenu>
        </>
      )}

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ThemeToggle />
    </>
  );
};

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link";
  onBack: () => void;
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
);

export function SimpleEditor() {
  const [readonly, setReadonly] = useState(false);
  const isMobile = useIsBreakpoint();
  const { height } = useWindowSize();
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main",
  );
  const toolbarRef = useRef<HTMLDivElement>(null);

  const extensions = useMemo<Extensions>(() => [
    StarterKit.configure({
      horizontalRule: false,
      orderedList: false,
      bulletList: false,
      link: {
        openOnClick: false,
        enableClickSelection: true,
      },
    }),
    HorizontalRule,
    CustomOrderedList,
    CustomBulletList,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    CustomTaskList,
    TaskItem.configure({ nested: true }),
    Highlight.configure({ multicolor: true }),
    Image.extend({
      atom: true,
      addAttributes() {
        return {
          ...this.parent?.(),
          "data-align": {
            default: null,
            parseHTML: (element) => element.getAttribute("data-align"),
            renderHTML: (attributes) => {
              if (!attributes["data-align"]) return {};
              return { "data-align": attributes["data-align"] };
            },
          },
        };
      },
    }).configure({
      resize: {
        enabled: true,
        alwaysPreserveAspectRatio: true,
      },
    }),
    Typography,
    Superscript,
    Subscript,
    Selection,
    TableRowFilter,
    TableHeader,
    TableCell,
    TableFilter.configure({
      resizable: true,
    }),
    Details,
    DetailsSummary,
    DetailsContent,
    AlertNode,
    ErrorBlockNode,
    WarningNode,
    WarningTitle,
    WarningMessage,
    ColumnsNode,
    ColumnItem,
    TextStyle,
    Color,
    FontSize,
    FontFamily,
    NodeBackground,
    ImageUploadNode.configure({
      accept: "image/*",
      maxSize: MAX_FILE_SIZE,
      limit: 3,
      upload: handleImageUpload,
      onError: (error) => console.error("Upload failed:", error),
    }),
  ], []);

  const safeContent = useMemo(
    () => sanitizeContent(content, extensions),
    [content, extensions]
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      editorProps: {
        attributes: {
          autocomplete: "off",
          autocorrect: "off",
          autocapitalize: "off",
          "aria-label": "Main content area, start typing to enter text.",
          class: "simple-editor",
        },
        handlePaste(view, event) {
          const items = event.clipboardData?.items;
          if (!items) return false;

          const hasHtml = Array.from(items).some(
            (item) => item.type === "text/html"
          );

          if (hasHtml) {
            // Must read synchronously — clipboardData is only available during the event
            const sanitizedHtml =
              event.clipboardData!.getData("text/html") ?? "";
            event.preventDefault();

            const doInsert = async () => {
              let htmlToProcess = sanitizedHtml;

              // Try the unsanitized clipboard API (Chromium 104+).
              // This returns the full HTML including the <style> block that
              // browsers normally strip, enabling Excel class-based styles to
              // be resolved. Falls back to sanitized HTML for other browsers.
              try {
                const clipItems = await (
                  navigator.clipboard as any
                ).read({ unsanitized: ["text/html"] });
                for (const clipItem of clipItems) {
                  if (clipItem.types.includes("text/html")) {
                    const blob = await clipItem.getType("text/html");
                    htmlToProcess = await blob.text();
                    break;
                  }
                }
              } catch {
                // Unsanitized API unavailable (Safari, older Chromium) —
                // use the sanitized HTML already read above.
              }

              const normalizedBody = normalizePastedTableHTML(htmlToProcess);
              const parser = PMDOMParser.fromSchema(view.state.schema);
              const slice = parser.parseSlice(normalizedBody);
              const tr = view.state.tr.replaceSelection(slice);
              view.dispatch(tr.scrollIntoView());
            };

            doInsert();
            return true;
          }

          const files = Array.from(items)
            .filter((item) => item.type.startsWith("image/"))
            .map((item) => item.getAsFile())
            .filter((f): f is File => f !== null);

          if (files.length === 0) return false;

          event.preventDefault();

          const nodeType = view.state.schema.nodes.imageUpload;

          if (nodeType) {
            let tr = view.state.tr;
            for (const file of files) {
              const id = crypto.randomUUID();
              pendingUploadFiles.set(id, [file]);
              const node = nodeType.create({ id });
              tr = tr.replaceSelectionWith(node);
            }
            view.dispatch(tr);
          }

          return true;
        },
      },
      extensions,
      content: safeContent,
      editable: !readonly,
      dispatchTransaction({ transaction, next }) {
        try {
          next(transaction);
        } catch (err) {
          console.error("[tiptap] transaction error, reverting:", err);
        }
      },
    },
    [readonly],
  );

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  });

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  return (
    <div className="simple-editor-wrapper">
      <button onClick={() => setReadonly(!readonly)}>
        {readonly ? "Readonly" : "Editable"}
      </button>
      <EditorContext.Provider value={{ editor }}>
        {!readonly ? (
          <Toolbar
            ref={toolbarRef}
            style={{
              ...(isMobile
                ? {
                    bottom: `calc(100% - ${height - rect.y}px)`,
                  }
                : {}),
            }}
          >
            {mobileView === "main" ? (
              <MainToolbarContent
                onHighlighterClick={() => setMobileView("highlighter")}
                onLinkClick={() => setMobileView("link")}
                isMobile={isMobile}
                toolbarRef={toolbarRef}
              />
            ) : (
              <MobileToolbarContent
                type={mobileView === "highlighter" ? "highlighter" : "link"}
                onBack={() => setMobileView("main")}
              />
            )}
          </Toolbar>
        ) : null}

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
          onClick={(e) => {
            if (!(e.ctrlKey || e.metaKey)) return;
            const target = (e.target as HTMLElement).closest("a");
            if (!target?.href) return;
            const url = sanitizeUrl(target.href);
            if (url) {
              e.preventDefault();
              window.open(url, "_blank", "noopener,noreferrer");
            }
          }}
        />

        <BubbleMenu editor={editor} />
        <ImageBubbleMenu editor={editor} />
      </EditorContext.Provider>
    </div>
  );
}
