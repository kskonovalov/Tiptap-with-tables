"use client";

import React, { useEffect, useRef, useState } from "react";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
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
import { ImageUploadNode } from "../../tiptap-node/image-upload-node/image-upload-node-extension";
import { HorizontalRule } from "../../tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import { AlertNode } from "../../tiptap-node/alert-node/index";
import {
  WarningNode,
  WarningTitle,
  WarningMessage,
} from "../../tiptap-node/warning-node/index";
import { ColumnsNode, ColumnItem } from "../../tiptap-node/columns-node/index";
import { Color, TextStyle } from "../../tiptap-node/color-node/index";
import { FontSize } from "../../tiptap-node/fontsize-node/index";
import { TableFilter } from "../../tiptap-node/table-filter-node/index";
import { TableRowFilter } from "../../tiptap-node/table-row-filter-node/index";
import "../../tiptap-node/alert-node/alert-node.scss";
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
import { handleFileUpload, handleImageUpload, MAX_FILE_SIZE } from "../../../lib/tiptap-utils";

// --- Styles ---
import "./simple-editor.scss";

import content from "./data/content.json";

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

          const imageItems = Array.from(items).filter((item) =>
            item.type.startsWith("image/"),
          );
          if (imageItems.length === 0) return false;

          event.preventDefault();

          imageItems.forEach((item) => {
            const file = item.getAsFile();
            if (!file) return;

            handleFileUpload(file)
              .then((result) => {
                if (!result.success || !result.file) return;
                const { schema } = view.state;
                const imageNode = schema.nodes.image.create({ src: result.file.url, title: result.file.title });
                const tr = view.state.tr.replaceSelectionWith(imageNode);
                view.dispatch(tr);
              })
              .catch((err: unknown) => {
                console.error("Image paste upload failed:", err);
              });
          });

          return true;
        },
      },
      extensions: [
        StarterKit.configure({
          horizontalRule: false,
          link: {
            openOnClick: false,
            enableClickSelection: true,
          },
        }),
        HorizontalRule,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        TaskList,
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
        WarningNode,
        WarningTitle,
        WarningMessage,
        ColumnsNode,
        ColumnItem,
        TextStyle,
        Color,
        FontSize,
        ImageUploadNode.configure({
          accept: "image/*",
          maxSize: MAX_FILE_SIZE,
          limit: 3,
          upload: handleImageUpload,
          onError: (error) => console.error("Upload failed:", error),
        }),
      ],
      content,
      editable: !readonly,
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
        />

        <BubbleMenu editor={editor} />
        <ImageBubbleMenu editor={editor} />
      </EditorContext.Provider>
    </div>
  );
}
