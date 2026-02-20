import {
  NodeViewContent,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import type { OrderedListStyleType } from "../ordered-list-node/ordered-list-node-extension";
import type { BulletListStyleType } from "../bullet-list-node/bullet-list-node-extension";
import {
  listOptions,
  toggleList,
  type ListType,
} from "../../tiptap-ui/list-button/index";

const ORDERED_STYLES: { value: OrderedListStyleType; label: string }[] = [
  { value: "list-decimal", label: "1" },
  { value: "list-upper-alpha", label: "A" },
  { value: "list-lower-alpha", label: "a" },
  { value: "list-upper-roman", label: "I" },
  { value: "list-lower-roman", label: "i" },
];

const BULLET_STYLES: { value: BulletListStyleType; label: string }[] = [
  { value: "list-disc", label: "•" },
  { value: "list-check", label: "✓" },
  { value: "list-plus", label: "+" },
];

export const ListNodeViewComponent: React.FC<NodeViewProps> = ({
  editor,
  getPos,
  node,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [startInputValue, setStartInputValue] = useState("1");

  const isOrderedList = node.type.name === "orderedList";
  const isTaskList = node.type.name === "taskList";

  const currentOrderedStyle: OrderedListStyleType =
    (node.attrs.class as OrderedListStyleType) ?? "list-decimal";
  const currentOrderedStart: number = (node.attrs.start as number) ?? 1;
  const currentBulletStyle: BulletListStyleType =
    (node.attrs.class as BulletListStyleType) ?? "list-disc";

  // Keep start input in sync with the node attr
  useEffect(() => {
    if (isOrderedList) {
      setStartInputValue(String(currentOrderedStart));
    }
  }, [isOrderedList, currentOrderedStart]);

  const nodePos = getPos();
  const isActive =
    typeof nodePos === "number" &&
    editor.state.selection.from >= nodePos &&
    editor.state.selection.from < nodePos + node.nodeSize;

  // Re-render whenever the selection changes so isActive stays up-to-date
  useEffect(() => {
    const onSel = () => forceUpdate();
    editor.on("selectionUpdate", onSel);
    const raf = requestAnimationFrame(forceUpdate);
    return () => {
      cancelAnimationFrame(raf);
      editor.off("selectionUpdate", onSel);
    };
  }, [editor]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const setOrderedStyle = useCallback(
    (style: OrderedListStyleType) => {
      editor
        .chain()
        .focus()
        .updateAttributes("orderedList", { class: style })
        .run();
      closeMenu();
    },
    [editor, closeMenu],
  );

  const setOrderedStart = useCallback(
    (start: number) => {
      editor.chain().focus().updateAttributes("orderedList", { start }).run();
      closeMenu();
    },
    [editor, closeMenu],
  );

  const setBulletStyle = useCallback(
    (style: BulletListStyleType) => {
      editor
        .chain()
        .focus()
        .updateAttributes("bulletList", { class: style })
        .run();
      closeMenu();
    },
    [editor, closeMenu],
  );

  const switchListType = useCallback(
    (type: ListType) => {
      toggleList(editor, type);
      closeMenu();
    },
    [editor, closeMenu],
  );

  // Calculate control button / menu position
  const getControlPos = () => {
    if (!wrapperRef.current) return null;
    const listEl = wrapperRef.current.querySelector(
      "ol, ul",
    ) as HTMLElement | null;
    if (!listEl) return null;
    const rect = listEl.getBoundingClientRect();
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    return {
      top: rect.top - wrapperRect.top - 28,
      left: rect.left - wrapperRect.left - 28,
    };
  };

  const controlPos = getControlPos();

  // Apply class and start attrs to the actual ul/ol element
  useEffect(() => {
    const listEl = wrapperRef.current?.querySelector(
      "ol, ul",
    ) as HTMLElement | null;
    if (!listEl) return;

    if (!isTaskList) {
      listEl.className =
        node.attrs.class || (isOrderedList ? "list-decimal" : "list-disc");
    }

    if (isOrderedList) {
      (listEl as HTMLOListElement).start = currentOrderedStart;
    }
  }, [isOrderedList, node.attrs.class, currentOrderedStart]);

  // Close menu on click outside the wrapper
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  // Close menu on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close menu when user interacts with the editor INSIDE this list:
  // - typing, enter, delete => transaction
  // - clicking into list changes selection => selectionUpdate
  useEffect(() => {
    if (!menuOpen) return;

    const isSelectionInsideThisNode = () => {
      const pos = getPos();
      if (typeof pos !== "number") return false;
      const from = editor.state.selection.from;
      return from >= pos && from < pos + node.nodeSize;
    };

    const closeIfInside = () => {
      if (isSelectionInsideThisNode()) {
        setMenuOpen(false);
      }
    };

    editor.on("transaction", closeIfInside);
    editor.on("selectionUpdate", closeIfInside);

    return () => {
      editor.off("transaction", closeIfInside);
      editor.off("selectionUpdate", closeIfInside);
    };
  }, [editor, getPos, node.nodeSize, menuOpen]);

  // Close menu on any pointer down inside the list content area (click inside list)
  // but keep it open if the click is inside the menu or the main control button.
  const handlePointerDownCapture = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!menuOpen) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest(".list-control-menu")) return;
      if (target.closest(".list-main-control-button")) return;

      const listEl = wrapperRef.current?.querySelector("ol, ul");
      if (listEl && listEl.contains(target)) {
        setMenuOpen(false);
      }
    },
    [menuOpen],
  );

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className="list-node-wrapper"
      onPointerDownCapture={handlePointerDownCapture}
    >
      <NodeViewContent />

      {isActive && controlPos && (
        <button
          className="list-main-control-button"
          contentEditable={false}
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          style={{
            position: "absolute",
            top: `${controlPos.top}px`,
            left: `${controlPos.left}px`,
          }}
        >
          ⋮
        </button>
      )}

      {isActive && menuOpen && controlPos && (
        <div
          className="list-control-menu"
          contentEditable={false}
          onPointerDown={(e) => {
            // Allow input elements to receive focus normally.
            // For everything else, prevent the editor from losing its selection.
            if ((e.target as HTMLElement).tagName !== "INPUT") {
              e.preventDefault();
            }
            e.stopPropagation();
          }}
          style={{
            position: "absolute",
            top: `${controlPos.top}px`,
            left: `${controlPos.left + 32}px`,
          }}
        >
          <div className="list-control-menu-label">Тип списка</div>
          <div className="list-control-style-buttons">
            {listOptions.map(({ type, label, icon: TypeIcon }) => (
              <button
                key={type}
                type="button"
                title={label}
                className={`list-style-option${node.type.name === type ? " active" : ""}`}
                onClick={() => switchListType(type)}
              >
                <TypeIcon width="1em" height="1em" />
              </button>
            ))}
          </div>

          {isOrderedList && (
            <>
              <div className="list-control-menu-label">Стиль нумерации</div>
              <div className="list-control-style-buttons">
                {ORDERED_STYLES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`list-style-option${
                      currentOrderedStyle === value ? " active" : ""
                    }`}
                    onClick={() => setOrderedStyle(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="list-control-menu-label">Начать с</div>
              <input
                type="number"
                min={1}
                value={startInputValue}
                className="list-start-input"
                onChange={(e) => setStartInputValue(e.target.value)}
                onBlur={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (!isNaN(n) && n >= 1) {
                    setOrderedStart(n);
                  } else {
                    setStartInputValue(String(currentOrderedStart));
                    closeMenu();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const n = parseInt(startInputValue, 10);
                    if (!isNaN(n) && n >= 1) {
                      setOrderedStart(n);
                    } else {
                      setStartInputValue(String(currentOrderedStart));
                      closeMenu();
                    }
                  }
                  e.stopPropagation();
                }}
              />
            </>
          )}

          {!isOrderedList && !isTaskList && (
            <>
              <div className="list-control-menu-label">Стиль маркера</div>
              <div className="list-control-style-buttons">
                {BULLET_STYLES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`list-style-option${
                      currentBulletStyle === value ? " active" : ""
                    }`}
                    onClick={() => setBulletStyle(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
};

export default ListNodeViewComponent;
