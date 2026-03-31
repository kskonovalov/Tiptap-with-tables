import {
  NodeViewContent,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface FilterOption {
  value: string;
  checked: boolean;
}

type CellCoords = { row: number; col: number };

const MIN_COLUMN_WIDTH = 50;

export const TableFilterComponent: React.FC<NodeViewProps> = ({
  node,
  getPos,
  editor,
}) => {
  console.log("TableFilterComponent rerender", node);
  const [columnFilters, setColumnFilters] = useState<
    Map<number, FilterOption[]>
  >(new Map());
  const [openColumnIndex, setOpenColumnIndex] = useState<number | null>(null);

  const [activeCell, setActiveCell] = useState<CellCoords | null>(null);

  const [openRowMenu, setOpenRowMenu] = useState<number | null>(null);
  const [openColMenu, setOpenColMenu] = useState<number | null>(null);
  const [openTableMenu, setOpenTableMenu] = useState(false);
  const [columnSearches, setColumnSearches] = useState<Map<number, string>>(
    new Map(),
  );
  const [sortState, setSortState] = useState<{
    col: number;
    dir: "asc" | "desc";
  } | null>(null);
  const [, forceUpdate] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pendingFiltersRef = useRef<Map<number, FilterOption[]> | null>(null);
  const pendingSortRef = useRef<{ col: number; dir: "asc" | "desc" } | null | undefined>(undefined);
  const originalRowOrderRef = useRef<HTMLElement[] | null>(null);

  const isEditable = editor.isEditable;

  // Загрузить сохранённые фильтры из node.attrs при монтировании
  useEffect(() => {
    const savedFilters = node.attrs.filters || {};
    const loadedFilters = new Map<number, FilterOption[]>();
    if (Object.keys(savedFilters).length > 0) {
      Object.entries(savedFilters).forEach(([colIndex, uncheckedValues]) => {
        const values = collectColumnValues(Number(colIndex));
        const filters: FilterOption[] = [
          {
            value: "",
            checked: !(uncheckedValues as string[]).includes(""),
          },
          ...values
            .filter((v) => v !== "")
            .map((v) => ({
              value: v,
              checked: !(uncheckedValues as string[]).includes(v),
            })),
        ];
        loadedFilters.set(Number(colIndex), filters);
      });
      // Synchronously store loaded filters in a ref so Effect 2 (apply filters)
      // can use them in the same flush — before setColumnFilters state update propagates.
      pendingFiltersRef.current = loadedFilters;
      setColumnFilters(loadedFilters);
    } else {
      pendingFiltersRef.current = null;
    }

    // Load sort state from node attrs
    const savedSort = node.attrs.sort ?? null;
    pendingSortRef.current = savedSort;
    setSortState(savedSort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.attrs]);

  // Получить количество колонок
  const getColumnCount = useCallback(() => {
    if (!node.firstChild) return 0;
    let count = 0;
    node.firstChild.forEach((cell) => {
      if (cell.type.name === "tableHeader" || cell.type.name === "tableCell") {
        count++;
      }
    });
    return count;
  }, [node]);

  // Собрать значения для колонки
  const collectColumnValues = useCallback(
    (colIndex: number) => {
      const values = new Set<string>();

      // Пропустить первую строку (header)
      let rowIndex = 0;
      node.forEach((rowNode) => {
        if (rowNode.type.name === "tableRow") {
          if (rowIndex > 0) {
            let cellIndex = 0;
            rowNode.forEach((cellNode) => {
              if (cellIndex === colIndex) {
                const text = cellNode.textContent.trim();
                values.add(text || "");
              }
              cellIndex++;
            });
          }
          rowIndex++;
        }
      });

      return Array.from(values);
    },
    [node],
  );

  // Toggle фильтр
  const toggleFilter = useCallback((colIndex: number, value: string) => {
    setColumnFilters((prev) => {
      const newFilters = new Map(prev);
      const columnFilter = newFilters.get(colIndex) || [];
      const updated = columnFilter.map((f) =>
        f.value === value ? { ...f, checked: !f.checked } : f,
      );
      newFilters.set(colIndex, updated);
      return newFilters;
    });
  }, []);

  // Сбросить фильтры для колонки
  const resetColumnFilters = useCallback((colIndex: number) => {
    setColumnFilters((prev) => {
      const newFilters = new Map(prev);
      const columnFilter = newFilters.get(colIndex) || [];
      const updated = columnFilter.map((f) => ({ ...f, checked: true }));
      newFilters.set(colIndex, updated);
      return newFilters;
    });
  }, []);

  // Инвертировать фильтры для колонки
  const invertColumnFilters = useCallback((colIndex: number) => {
    setColumnFilters((prev) => {
      const newFilters = new Map(prev);
      const columnFilter = newFilters.get(colIndex) || [];
      const updated = columnFilter.map((f) => ({ ...f, checked: !f.checked }));
      newFilters.set(colIndex, updated);
      return newFilters;
    });
  }, []);

  // Открыть фильтр для колонки
  const handleFilterClick = useCallback(
    (colIndex: number) => {
      if (openColumnIndex === colIndex) {
        setOpenColumnIndex(null);
      } else {
        const values = collectColumnValues(colIndex);
        const existingFilters = columnFilters.get(colIndex);

        const newFilters: FilterOption[] = [
          {
            value: "",
            checked:
              existingFilters?.find((f) => f.value === "")?.checked ?? true,
          },
          ...values
            .filter((v) => v !== "")
            .map((v) => ({
              value: v,
              checked:
                existingFilters?.find((f) => f.value === v)?.checked ?? true,
            })),
        ];

        setColumnFilters((prev) => {
          const updated = new Map(prev);
          updated.set(colIndex, newFilters);
          return updated;
        });
        setOpenColumnIndex(colIndex);
      }
    },
    [openColumnIndex, columnFilters, collectColumnValues],
  );

  // Сортировка по колонке: null → asc → desc → null
  const handleSortClick = useCallback((colIndex: number) => {
    setSortState((prev) => {
      if (!prev || prev.col !== colIndex) return { col: colIndex, dir: "asc" };
      if (prev.dir === "asc") return { col: colIndex, dir: "desc" };
      return null;
    });
  }, []);

  // Применить сортировку
  useEffect(() => {
    const effectiveSort =
      pendingSortRef.current !== undefined
        ? pendingSortRef.current
        : sortState;
    pendingSortRef.current = undefined;

    const pos = getPos();
    if (typeof pos !== "number") return;

    if (isEditable) {
      const { state } = editor;
      const { tr } = state;

      const tableNode = node;
      const tablePos = pos;

      // Collect rows
      const rows: ReturnType<typeof node.child>[] = [];
      tableNode.forEach((rowNode) => {
        if (rowNode.type.name === "tableRow") {
          rows.push(rowNode);
        }
      });

      if (rows.length < 2) {
        // Nothing to sort; just persist attrs if needed
        const currentSort = JSON.stringify(tableNode.attrs.sort ?? null);
        const newSort = JSON.stringify(effectiveSort);
        if (currentSort !== newSort) {
          tr.setNodeMarkup(tablePos, null, {
            ...tableNode.attrs,
            sort: effectiveSort,
          });
          editor.view.dispatch(tr);
        }
        return;
      }

      const headerRow = rows[0];
      const dataRows = rows.slice(1);

      const hasOriginalIndex = dataRows.some(
        (row) => row.attrs.originalIndex != null,
      );

      let sortedRows: typeof dataRows;

      if (effectiveSort) {
        // Stamp originalIndex on rows the first time sort is applied
        const indexedRows = hasOriginalIndex
          ? dataRows
          : dataRows.map((row, i) =>
              row.type.create(
                { ...row.attrs, originalIndex: i },
                row.content,
                row.marks,
              ),
            );

        const getCellText = (row: (typeof indexedRows)[number]) => {
          let text = "";
          let i = 0;
          row.forEach((cell) => {
            if (i === effectiveSort.col) text = cell.textContent.trim();
            i++;
          });
          return text;
        };

        sortedRows = [...indexedRows].sort((a, b) => {
          const cmp = getCellText(a).localeCompare(getCellText(b), undefined, {
            numeric: true,
            sensitivity: "base",
          });
          return effectiveSort.dir === "asc" ? cmp : -cmp;
        });
      } else if (hasOriginalIndex) {
        // Restore original order and clear the originalIndex stamps
        sortedRows = [...dataRows]
          .sort(
            (a, b) =>
              (a.attrs.originalIndex ?? 0) - (b.attrs.originalIndex ?? 0),
          )
          .map((row) =>
            row.type.create(
              { ...row.attrs, originalIndex: null },
              row.content,
              row.marks,
            ),
          );
      } else {
        sortedRows = dataRows;
      }

      // Check if rows are already in the desired order (content + attrs)
      const sameOrder = sortedRows.every((row, i) => row.eq(dataRows[i]));

      const currentSort = JSON.stringify(tableNode.attrs.sort ?? null);
      const newSort = JSON.stringify(effectiveSort);
      const attrsChanged = currentSort !== newSort;

      if (sameOrder && !attrsChanged) return;

      const newTableAttrs = { ...tableNode.attrs, sort: effectiveSort };

      if (!sameOrder) {
        const newTable = tableNode.type.create(
          newTableAttrs,
          [headerRow, ...sortedRows],
          tableNode.marks,
        );
        tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);
      } else if (attrsChanged) {
        tr.setNodeMarkup(tablePos, null, newTableAttrs);
      }

      if (tr.docChanged) {
        editor.view.dispatch(tr);
      }
    } else {
      // Readonly: reorder DOM rows
      if (!wrapperRef.current) return;
      const table = wrapperRef.current.querySelector("table");
      if (!table) return;
      const tbody = table.querySelector("tbody");
      if (!tbody) return;

      const allRows = Array.from(tbody.querySelectorAll("tr")) as HTMLElement[];
      if (allRows.length <= 1) return;

      // Snapshot original order on first sort activation
      if (effectiveSort && !originalRowOrderRef.current) {
        originalRowOrderRef.current = allRows.slice(1);
      }

      if (!effectiveSort) {
        if (originalRowOrderRef.current) {
          // Restore from in-session snapshot
          originalRowOrderRef.current.forEach((row) => tbody.appendChild(row));
          originalRowOrderRef.current = null;
        } else {
          // Fall back to data-original-index stamps (e.g. page loaded with active sort)
          const dataRowsDOM = allRows.slice(1);
          const hasOrigIdx = dataRowsDOM.some(
            (r) => r.getAttribute("data-original-index") !== null,
          );
          if (hasOrigIdx) {
            [...dataRowsDOM]
              .sort(
                (a, b) =>
                  Number(a.getAttribute("data-original-index") ?? 0) -
                  Number(b.getAttribute("data-original-index") ?? 0),
              )
              .forEach((row) => tbody.appendChild(row));
          }
        }
        return;
      }

      const sourceRows = originalRowOrderRef.current ?? allRows.slice(1);
      const sorted = [...sourceRows].sort((a, b) => {
        const aCells = a.querySelectorAll("td, th");
        const bCells = b.querySelectorAll("td, th");
        const aText = (aCells[effectiveSort.col] as HTMLElement | undefined)
          ?.textContent?.trim() ?? "";
        const bText = (bCells[effectiveSort.col] as HTMLElement | undefined)
          ?.textContent?.trim() ?? "";
        const cmp = aText.localeCompare(bText, undefined, {
          numeric: true,
          sensitivity: "base",
        });
        return effectiveSort.dir === "asc" ? cmp : -cmp;
      });

      sorted.forEach((row) => tbody.appendChild(row));
    }
  }, [sortState, node, getPos, editor, isEditable]);

  // Применить фильтры
  useEffect(() => {
    // Effect 1 (load filters) runs before this effect in the same flush.
    // If it just loaded fresh filters from node.attrs, they are in pendingFiltersRef.current —
    // because setColumnFilters is async and the state update hasn't propagated yet.
    // Using pendingFiltersRef prevents this effect from seeing a stale empty columnFilters
    // and wiping node.attrs.filters with an empty object.
    const effectiveFilters = pendingFiltersRef.current ?? columnFilters;
    pendingFiltersRef.current = null;

    const pos = getPos();
    if (typeof pos !== "number") return;

    if (isEditable) {
      const { state } = editor;
      const { tr } = state;

      const tableNode = node;
      const tablePos = pos;

      let currentPos = tablePos + 1;
      let rowIndex = 0;

      tableNode.forEach((rowNode) => {
        if (rowNode.type.name === "tableRow") {
          if (rowIndex > 0) {
            let shouldHide = false;

            let cellIndex = 0;
            rowNode.forEach((cellNode) => {
              if (cellNode.type.name === "tableCell") {
                const cellText = cellNode.textContent.trim();
                const filters = effectiveFilters.get(cellIndex);

                if (filters) {
                  const filterOption = filters.find(
                    (f) => f.value === cellText,
                  );
                  if (filterOption && !filterOption.checked) {
                    shouldHide = true;
                  }
                }
                cellIndex++;
              }
            });

            const currentHidden = rowNode.attrs.hidden || false;
            if (currentHidden !== shouldHide) {
              tr.setNodeMarkup(currentPos, null, {
                ...rowNode.attrs,
                hidden: shouldHide,
              });
            }
          }

          currentPos += rowNode.nodeSize;
          rowIndex++;
        }
      });

      const filtersToSave: Record<number, string[]> = {};
      effectiveFilters.forEach((filters, colIndex) => {
        const unchecked = filters.filter((f) => !f.checked).map((f) => f.value);
        if (unchecked.length > 0) {
          filtersToSave[colIndex] = unchecked;
        }
      });

      const currentFilters = JSON.stringify(node.attrs.filters || {});
      const newFilters = JSON.stringify(filtersToSave);
      if (currentFilters !== newFilters) {
        tr.setNodeMarkup(tablePos, null, {
          ...node.attrs,
          filters: filtersToSave,
        });
      }

      if (tr.docChanged) {
        editor.view.dispatch(tr);
      }
    } else {
      if (!wrapperRef.current) return;

      const table = wrapperRef.current.querySelector("table");
      if (!table) return;

      const rows = table.querySelectorAll("tbody tr");

      rows.forEach((row, rowIndex) => {
        if (rowIndex === 0) return;

        let shouldHide = false;

        if (effectiveFilters.size > 0) {
          effectiveFilters.forEach((filters, colIndex) => {
            const cells = row.querySelectorAll("td");
            const cell = cells[colIndex] as HTMLElement;
            if (!cell) return;

            const cellText = cell.textContent?.trim() || "";
            const filterOption = filters.find((f) => f.value === cellText);

            if (filterOption && !filterOption.checked) {
              shouldHide = true;
            }
          });
        }

        if (shouldHide) {
          row.classList.add("hidden");
          row.setAttribute("data-hidden", "true");
        } else {
          row.classList.remove("hidden");
          row.removeAttribute("data-hidden");
        }
      });
    }
  }, [columnFilters, getPos, editor, node, isEditable]);

  // Действия со строками
  const handleRowAction = useCallback(
    (rowIndex: number, action: "addAbove" | "addBelow" | "delete") => {
      if (!isEditable) return;
      setTimeout(() => {
        if (action === "addAbove") {
          editor.chain().focus().addRowBefore().run();
        } else if (action === "addBelow") {
          editor.chain().focus().addRowAfter().run();
        } else if (action === "delete") {
          editor.chain().focus().deleteRow().run();
        }
      }, 100);
      setOpenRowMenu(null);
    },
    [editor, isEditable],
  );

  // Действия с колонками
  const handleColAction = useCallback(
    (colIndex: number, action: "addBefore" | "addAfter" | "delete") => {
      if (!isEditable) return;
      setTimeout(() => {
        if (action === "addBefore") {
          editor.chain().focus().addColumnBefore().run();
        } else if (action === "addAfter") {
          editor.chain().focus().addColumnAfter().run();
        } else if (action === "delete") {
          editor.chain().focus().deleteColumn().run();
        }
      }, 100);
      setOpenColMenu(null);
    },
    [editor, isEditable],
  );

  // Действия с таблицей
  const handleTableAction = useCallback(
    (action: "delete" | "toggleHeader") => {
      if (!isEditable) return;

      setTimeout(() => {
        if (action === "delete") {
          editor.chain().focus().deleteTable().run();
        } else if (action === "toggleHeader") {
          editor.chain().focus().toggleHeaderRow().run();
        }
      }, 100);

      setOpenTableMenu(false);
    },
    [editor, isEditable],
  );

  // Проверить, есть ли заголовки
  const hasHeaderRow = useCallback(() => {
    if (!node.firstChild) return false;
    let hasHeader = false;
    node.firstChild.forEach((cell) => {
      if (cell.type.name === "tableHeader") {
        hasHeader = true;
      }
    });
    return hasHeader;
  }, [node]);

  // activeCell из editor.state.selection
  const getActiveCellFromSelection = useCallback(() => {
    const tablePos = getPos();
    if (typeof tablePos !== "number") return null;

    const from = editor.state.selection.from;
    const tableStart = tablePos;
    const tableEnd = tablePos + node.nodeSize;

    if (from <= tableStart || from >= tableEnd) return null;

    let found: CellCoords | null = null;
    let rowIndex = 0;

    node.forEach((rowNode, rowOffset) => {
      if (rowNode.type.name !== "tableRow" || found) return;

      let colIndex = 0;
      rowNode.forEach((cellNode, cellOffset) => {
        if (found) return;

        const cellFrom = tablePos + 1 + rowOffset + 1 + cellOffset;
        const cellTo = cellFrom + cellNode.nodeSize;

        if (from >= cellFrom && from < cellTo) {
          found = { row: rowIndex, col: colIndex };
        }

        colIndex++;
      });

      rowIndex++;
    });

    return found;
  }, [editor, getPos, node]);

  useEffect(() => {
    if (!isEditable) {
      if (activeCell !== null) setActiveCell(null);
      return;
    }

    const updateFromSelection = () => {
      const next = getActiveCellFromSelection();

      if (next === null) {
        if (activeCell !== null) {
          setActiveCell(null);
          setOpenRowMenu(null);
          setOpenColMenu(null);
          setOpenTableMenu(false);
          setOpenColumnIndex(null);
        }
        return;
      }

      if (
        activeCell === null ||
        activeCell.row !== next.row ||
        activeCell.col !== next.col
      ) {
        setActiveCell(next);
        setOpenRowMenu(null);
        setOpenColMenu(null);
        setOpenTableMenu(false);
        setOpenColumnIndex(null);
      }
    };

    updateFromSelection();
    editor.on("selectionUpdate", updateFromSelection);

    return () => {
      editor.off("selectionUpdate", updateFromSelection);
    };
  }, [
    editor,
    isEditable,
    getActiveCellFromSelection,
    activeCell,
    openRowMenu,
    openColMenu,
    openTableMenu,
    openColumnIndex,
  ]);

  // Клик вне таблицы: закрытие
  useEffect(() => {
    const handleDocPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const clickedInWrapper = wrapperRef.current?.contains(target) ?? false;
      const clickedInDropdown =
        target.closest(".table-filter-dropdown") !== null;
      const clickedInMenu = target.closest(".table-control-menu") !== null;
      const clickedInFilterButton =
        target.closest(".table-filter-button") !== null;

      if (
        clickedInWrapper &&
        !clickedInDropdown &&
        !clickedInMenu &&
        !clickedInFilterButton
      ) {
        if (!isEditable) setOpenColumnIndex(null);
      }

      if (!clickedInWrapper && !clickedInDropdown && !clickedInMenu) {
        // 1) фильтры закрываем всегда (и в read-only тоже)
        setOpenColumnIndex(null);

        // 2) остальное — только если редактирование включено
        if (isEditable) {
          setActiveCell(null);
          setOpenRowMenu(null);
          setOpenColMenu(null);
          setOpenTableMenu(false);
        }
      }
    };

    document.addEventListener("pointerdown", handleDocPointerDown);
    return () =>
      document.removeEventListener("pointerdown", handleDocPointerDown);
  }, [isEditable]);

  // 3) Esc — тоже закрыть
  useEffect(() => {
    if (!isEditable) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setActiveCell(null);
      setOpenColumnIndex(null);
      setOpenRowMenu(null);
      setOpenColMenu(null);
      setOpenTableMenu(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isEditable]);

  // Re-render when the wrapper becomes visible (e.g. switching between editors)
  // so that inline getBoundingClientRect() calls return correct positions.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          forceUpdate((n) => n + 1);
        }
      },
      { threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Re-position filter/sort buttons in editable mode when any ancestor scrolls.
  useEffect(() => {
    if (!isEditable) return;
    let rafId: number;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => forceUpdate((n) => n + 1));
    };
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('scroll', onScroll, true);
      cancelAnimationFrame(rafId);
    };
  }, [isEditable]);

  const columnCount = getColumnCount();

  // Imperative resize handles for readonly mode.
  // Managed entirely via DOM so positions can be updated live during drag.
  useEffect(() => {
    if (isEditable) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let handleEls: HTMLDivElement[] = [];
    let positionHandles: (() => void) | null = null;

    const cleanup = () => {
      handleEls.forEach((h) => h.remove());
      handleEls = [];
    };

    // Defer so colgroup and layout are ready
    const timer = window.setTimeout(() => {
      const table = wrapper.querySelector("table");
      if (!table || columnCount <= 0) return;

      positionHandles = () => {
        const tableRect = table.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        const firstRow = table.querySelector("tbody tr:first-child");
        const cells = firstRow?.querySelectorAll("th, td");
        const filterButtons = wrapper.querySelectorAll(".table-filter-button");
        const sortButtons = wrapper.querySelectorAll(".table-sort-button");
        handleEls.forEach((handle, i) => {
          const cell = cells?.[i] as HTMLElement | undefined;
          if (!cell) return;
          const cellRect = cell.getBoundingClientRect();
          const rightOffset = cellRect.right - wrapperRect.left;
          handle.style.left = `${rightOffset - 4}px`;
          handle.style.top = `${tableRect.top - wrapperRect.top}px`;
          handle.style.height = `${tableRect.height}px`;
          const filterBtn = filterButtons[i] as HTMLElement | undefined;
          if (filterBtn) filterBtn.style.left = `${rightOffset - 28}px`;
          const sortBtn = sortButtons[i] as HTMLElement | undefined;
          if (sortBtn) sortBtn.style.left = `${rightOffset - 56}px`;
        });
      };

      for (let i = 0; i < columnCount; i++) {
        const colIndex = i;
        const handle = document.createElement("div");
        handle.style.cssText =
          "position:absolute;width:8px;cursor:col-resize;z-index:10;";

        handle.addEventListener("mousedown", (e) => {
          e.preventDefault();
          const cols = table.querySelectorAll("colgroup col");
          const col = cols[colIndex] as HTMLTableColElement | undefined;
          if (!col) return;

          const startX = e.clientX;
          const startWidth = col.offsetWidth || parseInt(col.style.width) || 100;

          const onMouseMove = (moveEvent: MouseEvent) => {
            col.style.width = `${Math.max(MIN_COLUMN_WIDTH, startWidth + moveEvent.clientX - startX)}px`;
            positionHandles?.();
          };
          const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          };
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });

        wrapper.appendChild(handle);
        handleEls.push(handle);
      }

      positionHandles();
      document.addEventListener('scroll', positionHandles, true);
    }, 50);

    return () => {
      clearTimeout(timer);
      if (positionHandles) document.removeEventListener('scroll', positionHandles, true);
      cleanup();
    };
  }, [isEditable, columnCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentFilters =
    openColumnIndex !== null ? columnFilters.get(openColumnIndex) : [];

  // тк table row переопределён, на текущий момент это единственный способ добавить colgroup
  // без colgroup ресайз таблиц работать не будет
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const table = wrapper.querySelector("table");
    if (!table) return;

    if (columnCount <= 0) return;

    const ensureColgroup = () => {
      const directColgroup = Array.from(table.children).find(
        (el) => el.tagName === "COLGROUP",
      ) as HTMLTableColElement | undefined;

      const colgroup = directColgroup ?? document.createElement("colgroup");

      if (!directColgroup) {
        table.insertBefore(colgroup, table.firstChild);
      }

      const existingCols = Array.from(colgroup.querySelectorAll("col"));
      const widths = existingCols.map(
        (c) => (c as HTMLTableColElement).style.width,
      );

      if (existingCols.length !== columnCount) {
        const firstRowCells = Array.from(
          table.querySelectorAll("tbody tr:first-child th, tbody tr:first-child td"),
        );
        while (colgroup.firstChild) colgroup.removeChild(colgroup.firstChild);
        for (let i = 0; i < columnCount; i++) {
          const col = document.createElement("col");
          if (widths[i]) {
            col.style.width = widths[i];
          } else {
            const cell = firstRowCells[i] as HTMLElement | undefined;
            const colwidthAttr = cell?.getAttribute("colwidth");
            if (colwidthAttr) {
              const w = parseInt(colwidthAttr.split(",")[0], 10);
              if (!isNaN(w) && w > 0) col.style.width = `${w}px`;
            }
          }
          colgroup.appendChild(col);
        }
      }
    };

    const raf = requestAnimationFrame(() => ensureColgroup());
    const t1 = window.setTimeout(() => ensureColgroup(), 0);
    const t2 = window.setTimeout(() => ensureColgroup(), 50);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [columnCount]);

  // таблица "активна", если есть активная ячейка или открыто меню таблицы
  const tableIsActive = isEditable && (activeCell !== null || openTableMenu);

  return (
    <NodeViewWrapper className="table-filter-wrapper" ref={wrapperRef}>
      <NodeViewContent as="table" className="table-filter" />

      {/* Кнопки фильтров поверх заголовков */}
      <div className="table-filter-buttons-overlay" contentEditable={false}>
        {Array.from({ length: columnCount }).map((_, colIndex) => {
          const table = wrapperRef.current?.querySelector("table");
          const firstRow = table?.querySelector("tbody tr:first-child");
          const cells = firstRow?.querySelectorAll("th, td");
          const cell = cells?.[colIndex] as HTMLElement | undefined;
          const rect = cell?.getBoundingClientRect();
          const wrapperRect = wrapperRef.current?.getBoundingClientRect();

          if (!rect || !wrapperRect) return null;

          const filters = columnFilters.get(colIndex);
          const hasActiveFilters = filters?.some((f) => !f.checked) || false;

          const sortClass =
            sortState?.col === colIndex
              ? `active-${sortState.dir}`
              : "";

          return (
            <React.Fragment key={colIndex}>
              <button
                className={`table-sort-button ${sortClass}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSortClick(colIndex);
                }}
                type="button"
                style={{
                  position: "absolute",
                  top: `${rect.top - wrapperRect.top + 4}px`,
                  left: `${rect.right - wrapperRect.left - 56}px`,
                }}
              >
                {sortState?.col === colIndex
                  ? sortState.dir === "asc"
                    ? "↑"
                    : "↓"
                  : "⇅"}
              </button>
              <button
                className={`table-filter-button ${
                  hasActiveFilters ? "active" : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFilterClick(colIndex);
                }}
                type="button"
                style={{
                  position: "absolute",
                  top: `${rect.top - wrapperRect.top + 4}px`,
                  left: `${rect.right - wrapperRect.left - 28}px`,
                }}
              >
                ⋮
              </button>
            </React.Fragment>
          );
        })}
      </div>


      {openColumnIndex !== null &&
        currentFilters &&
        currentFilters.length > 0 &&
        wrapperRef.current &&
        (() => {
          const table = wrapperRef.current.querySelector("table");
          const firstRow = table?.querySelector("tbody tr:first-child");
          const cells = firstRow?.querySelectorAll("th, td");
          const cell = cells?.[openColumnIndex] as HTMLElement;
          const rect = cell?.getBoundingClientRect();
          const wrapperRect = wrapperRef.current.getBoundingClientRect();

          return (
            <div
              ref={dropdownRef}
              className="table-filter-dropdown"
              contentEditable={false}
              style={{
                position: "absolute",
                top: rect ? `${rect.bottom - wrapperRect.top}px` : "2rem",
                left: rect ? `${rect.left - wrapperRect.left}px` : "0",
                zIndex: 1000,
              }}
            >
              <div className="table-filter-search">
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={columnSearches.get(openColumnIndex) ?? ""}
                  onChange={(e) => {
                    setColumnSearches((prev) => {
                      const next = new Map(prev);
                      next.set(openColumnIndex, e.target.value);
                      return next;
                    });
                  }}
                  autoFocus
                />
              </div>
              <div className="table-filter-options">
                {((): typeof currentFilters => {
                  const search = (
                    columnSearches.get(openColumnIndex) ?? ""
                  ).toLowerCase();
                  return search.trim() === ""
                    ? currentFilters
                    : currentFilters.filter((f) =>
                        (f.value === "" ? "Пустое" : f.value)
                          .toLowerCase()
                          .includes(search),
                      );
                })().map((filter, index) => (
                  <label key={index} className="table-filter-option">
                    <input
                      type="checkbox"
                      checked={filter.checked}
                      onChange={() =>
                        toggleFilter(openColumnIndex, filter.value)
                      }
                    />
                    <span>{filter.value === "" ? "Пустое" : filter.value}</span>
                  </label>
                ))}
              </div>
              <div className="table-filter-actions">
                <button
                  type="button"
                  onClick={() => invertColumnFilters(openColumnIndex)}
                  className="table-filter-invert-button"
                >
                  Инвертировать
                </button>
                <button
                  type="button"
                  onClick={() => resetColumnFilters(openColumnIndex)}
                  className="table-filter-reset-button"
                >
                  Сбросить фильтры
                </button>
              </div>
            </div>
          );
        })()}

      {/* Кнопка управления таблицей (слева сверху) */}
      {tableIsActive &&
        (() => {
          const table = wrapperRef.current?.querySelector("table");
          const rect = table?.getBoundingClientRect();
          const wrapperRect = wrapperRef.current?.getBoundingClientRect();

          if (!rect || !wrapperRect) return null;

          return (
            <button
              className="table-main-control-button"
              contentEditable={false}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpenTableMenu((prev) => !prev);
                setOpenRowMenu(null);
                setOpenColMenu(null);
              }}
              type="button"
              style={{
                position: "absolute",
                top: `${rect.top - wrapperRect.top - 28}px`,
                left: `${rect.left - wrapperRect.left - 28}px`,
              }}
            >
              ⋮
            </button>
          );
        })()}

      {/* Меню действий с таблицей */}
      {isEditable &&
        openTableMenu &&
        (() => {
          const table = wrapperRef.current?.querySelector("table");
          const rect = table?.getBoundingClientRect();
          const wrapperRect = wrapperRef.current?.getBoundingClientRect();

          if (!rect || !wrapperRect) return null;

          const hasHeader = hasHeaderRow();

          return (
            <div
              className="table-control-menu"
              contentEditable={false}
              style={{
                position: "absolute",
                top: `${rect.top - wrapperRect.top - 28}px`,
                left: `${rect.left - wrapperRect.left}px`,
              }}
            >
              <button
                onClick={() => {
                  handleTableAction("toggleHeader");
                }}
              >
                {hasHeader ? "Убрать заголовки" : "Добавить заголовки"}
              </button>
              <button
                onClick={() => {
                  handleTableAction("delete");
                }}
              >
                Удалить таблицу
              </button>
            </div>
          );
        })()}

      {/* Кнопки управления строками (слева) */}
      {isEditable &&
        activeCell &&
        (() => {
          const table = wrapperRef.current?.querySelector("table");
          const rows = table?.querySelectorAll("tbody tr");
          const row = rows?.[activeCell.row] as HTMLElement;
          const rect = row?.getBoundingClientRect();
          const wrapperRect = wrapperRef.current?.getBoundingClientRect();

          if (!rect || !wrapperRect) return null;

          return (
            <button
              className="table-row-control-button"
              contentEditable={false}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpenRowMenu((prev) =>
                  prev === activeCell.row ? null : activeCell.row,
                );
                setOpenColMenu(null);
                setOpenTableMenu(false);
              }}
              type="button"
              style={{
                position: "absolute",
                top: `${rect.top - wrapperRect.top + rect.height / 2 - 12}px`,
                left: `${rect.left - wrapperRect.left - 28}px`,
              }}
            >
              ⋮
            </button>
          );
        })()}

      {/* Меню действий со строкой */}
      {isEditable &&
        openRowMenu !== null &&
        (() => {
          const table = wrapperRef.current?.querySelector("table");
          const rows = table?.querySelectorAll("tbody tr");
          const row = rows?.[openRowMenu] as HTMLElement;
          const rect = row?.getBoundingClientRect();
          const wrapperRect = wrapperRef.current?.getBoundingClientRect();

          if (!rect || !wrapperRect) return null;

          return (
            <div
              className="table-control-menu"
              contentEditable={false}
              style={{
                position: "absolute",
                top: `${rect.top - wrapperRect.top}px`,
                left: `${rect.left - wrapperRect.left - 180}px`,
              }}
            >
              <button onClick={() => handleRowAction(openRowMenu, "addAbove")}>
                Добавить строку выше
              </button>
              <button onClick={() => handleRowAction(openRowMenu, "addBelow")}>
                Добавить строку ниже
              </button>
              <button onClick={() => handleRowAction(openRowMenu, "delete")}>
                Удалить строку
              </button>
            </div>
          );
        })()}

      {/* Кнопки управления колонками (сверху) */}
      {isEditable &&
        activeCell &&
        (() => {
          const table = wrapperRef.current?.querySelector("table");
          const firstRow = table?.querySelector("tbody tr:first-child");
          const cells = firstRow?.querySelectorAll("th, td");
          const cell = cells?.[activeCell.col] as HTMLElement;
          const rect = cell?.getBoundingClientRect();
          const wrapperRect = wrapperRef.current?.getBoundingClientRect();

          if (!rect || !wrapperRect) return null;

          return (
            <button
              className="table-col-control-button"
              contentEditable={false}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpenColMenu((prev) =>
                  prev === activeCell.col ? null : activeCell.col,
                );
                setOpenRowMenu(null);
                setOpenTableMenu(false);
              }}
              type="button"
              style={{
                position: "absolute",
                top: `${rect.top - wrapperRect.top - 28}px`,
                left: `${rect.left - wrapperRect.left + rect.width / 2 - 12}px`,
              }}
            >
              ⋮
            </button>
          );
        })()}

      {/* Меню действий с колонкой */}
      {isEditable &&
        openColMenu !== null &&
        (() => {
          const table = wrapperRef.current?.querySelector("table");
          const firstRow = table?.querySelector("tbody tr:first-child");
          const cells = firstRow?.querySelectorAll("th, td");
          const cell = cells?.[openColMenu] as HTMLElement;
          const rect = cell?.getBoundingClientRect();
          const wrapperRect = wrapperRef.current?.getBoundingClientRect();

          if (!rect || !wrapperRect) return null;

          return (
            <div
              className="table-control-menu"
              contentEditable={false}
              style={{
                position: "absolute",
                top: `${rect.top - wrapperRect.top - 120}px`,
                left: `${rect.left - wrapperRect.left}px`,
              }}
            >
              <button onClick={() => handleColAction(openColMenu, "addBefore")}>
                Добавить колонку слева
              </button>
              <button onClick={() => handleColAction(openColMenu, "addAfter")}>
                Добавить колонку справа
              </button>
              <button onClick={() => handleColAction(openColMenu, "delete")}>
                Удалить колонку
              </button>
            </div>
          );
        })()}
    </NodeViewWrapper>
  );
};
