import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { TextSelection } from "@tiptap/pm/state"

interface FilterOption {
  value: string
  checked: boolean
}

export const TableFilterComponent: React.FC<NodeViewProps> = ({
  node,
  getPos,
  editor,
}) => {
  const [columnFilters, setColumnFilters] = useState<Map<number, FilterOption[]>>(new Map())
  const [openColumnIndex, setOpenColumnIndex] = useState<number | null>(null)
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null)
  const [hoveredTable, setHoveredTable] = useState(false)
  const [openRowMenu, setOpenRowMenu] = useState<number | null>(null)
  const [openColMenu, setOpenColMenu] = useState<number | null>(null)
  const [openTableMenu, setOpenTableMenu] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tableHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isEditable = editor.isEditable

  // Загрузить сохранённые фильтры из node.attrs при монтировании
  useEffect(() => {
    const savedFilters = node.attrs.filters || {}
    if (Object.keys(savedFilters).length > 0) {
      const loadedFilters = new Map<number, FilterOption[]>()
      Object.entries(savedFilters).forEach(([colIndex, uncheckedValues]) => {
        const values = collectColumnValues(Number(colIndex))
        const filters: FilterOption[] = [
          { 
            value: "", 
            checked: !(uncheckedValues as string[]).includes("") 
          },
          ...values.filter(v => v !== "").map(v => ({
            value: v,
            checked: !(uncheckedValues as string[]).includes(v),
          }))
        ]
        loadedFilters.set(Number(colIndex), filters)
      })
      setColumnFilters(loadedFilters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Получить количество колонок
  const getColumnCount = useCallback(() => {
    if (!node.firstChild) return 0
    let count = 0
    node.firstChild.forEach((cell) => {
      if (cell.type.name === "tableHeader" || cell.type.name === "tableCell") {
        count++
      }
    })
    return count
  }, [node])

  // Собрать значения для колонки
  const collectColumnValues = useCallback((colIndex: number) => {
    const values = new Set<string>()
    
    // Пропустить первую строку (header)
    let rowIndex = 0
    node.forEach((rowNode) => {
      if (rowNode.type.name === "tableRow") {
        if (rowIndex > 0) {
          let cellIndex = 0
          rowNode.forEach((cellNode) => {
            if (cellIndex === colIndex) {
              const text = cellNode.textContent.trim()
              values.add(text || "")
            }
            cellIndex++
          })
        }
        rowIndex++
      }
    })

    return Array.from(values)
  }, [node])

  // Toggle фильтр
  const toggleFilter = useCallback((colIndex: number, value: string) => {
    setColumnFilters(prev => {
      const newFilters = new Map(prev)
      const columnFilter = newFilters.get(colIndex) || []
      const updated = columnFilter.map(f => 
        f.value === value ? { ...f, checked: !f.checked } : f
      )
      newFilters.set(colIndex, updated)
      return newFilters
    })
  }, [])

  // Открыть фильтр для колонки
  const handleFilterClick = useCallback((colIndex: number) => {
    if (openColumnIndex === colIndex) {
      setOpenColumnIndex(null)
    } else {
      // Собрать значения для колонки
      const values = collectColumnValues(colIndex)
      const existingFilters = columnFilters.get(colIndex)
      
      const newFilters: FilterOption[] = [
        { value: "", checked: existingFilters?.find(f => f.value === "")?.checked ?? true },
        ...values.filter(v => v !== "").map(v => ({
          value: v,
          checked: existingFilters?.find(f => f.value === v)?.checked ?? true,
        }))
      ]

      setColumnFilters(prev => {
        const updated = new Map(prev)
        updated.set(colIndex, newFilters)
        return updated
      })
      setOpenColumnIndex(colIndex)
    }
  }, [openColumnIndex, columnFilters, collectColumnValues])

  // Применить фильтры
  const applyFilters = useCallback(() => {
    const pos = getPos()
    if (typeof pos !== "number") return

    if (isEditable) {
      // В editable режиме - обновляем document через ProseMirror API
      const { state } = editor
      const { tr } = state

      const tableNode = node
      const tablePos = pos

      let currentPos = tablePos + 1
      let rowIndex = 0

      // Пройти по всем строкам таблицы
      tableNode.forEach((rowNode) => {
        if (rowNode.type.name === "tableRow") {
          // Пропустить первую строку (header)
          if (rowIndex > 0) {
            let shouldHide = false

            // Проверить каждую колонку с активными фильтрами
            let cellIndex = 0
            rowNode.forEach((cellNode) => {
              if (cellNode.type.name === "tableCell") {
                const cellText = cellNode.textContent.trim()
                const filters = columnFilters.get(cellIndex)
                
                if (filters) {
                  const filterOption = filters.find(f => f.value === cellText)
                  if (filterOption && !filterOption.checked) {
                    shouldHide = true
                  }
                }
                cellIndex++
              }
            })

            // Обновить атрибут hidden для строки
            const currentHidden = rowNode.attrs.hidden || false
            if (currentHidden !== shouldHide) {
              tr.setNodeMarkup(currentPos, null, { ...rowNode.attrs, hidden: shouldHide })
            }
          }

          currentPos += rowNode.nodeSize
          rowIndex++
        }
      })

      // Сохранить состояние фильтров в table node
      const filtersToSave: Record<number, string[]> = {}
      columnFilters.forEach((filters, colIndex) => {
        const unchecked = filters.filter(f => !f.checked).map(f => f.value)
        if (unchecked.length > 0) {
          filtersToSave[colIndex] = unchecked
        }
      })

      // Обновить атрибут filters в table node
      const currentFilters = JSON.stringify(node.attrs.filters || {})
      const newFilters = JSON.stringify(filtersToSave)
      if (currentFilters !== newFilters) {
        tr.setNodeMarkup(tablePos, null, { ...node.attrs, filters: filtersToSave })
      }

      if (tr.docChanged) {
        editor.view.dispatch(tr)
      }
    } else {
      // В readonly режиме - только визуально скрываем через DOM
      if (!wrapperRef.current) return

      const table = wrapperRef.current.querySelector("table")
      if (!table) return

      const rows = table.querySelectorAll("tbody tr")
      
      rows.forEach((row, rowIndex) => {
        // Пропустить первую строку (header)
        if (rowIndex === 0) return

        let shouldHide = false

        // Если есть активные фильтры, проверяем каждую колонку
        if (columnFilters.size > 0) {
          columnFilters.forEach((filters, colIndex) => {
            const cells = row.querySelectorAll("td")
            const cell = cells[colIndex] as HTMLElement
            if (!cell) return

            const cellText = cell.textContent?.trim() || ""
            const filterOption = filters.find(f => f.value === cellText)

            if (filterOption && !filterOption.checked) {
              shouldHide = true
            }
          })
        }

        // Всегда обновляем класс и атрибут (показываем или скрываем)
        if (shouldHide) {
          row.classList.add("hidden")
          row.setAttribute("data-hidden", "true")
        } else {
          row.classList.remove("hidden")
          row.removeAttribute("data-hidden")
        }
      })
    }
  }, [columnFilters, getPos, editor, node, isEditable, wrapperRef])

  // Применить фильтры при изменении
  useEffect(() => {
    applyFilters()
  }, [columnFilters, applyFilters])

  // Нет useEffect для добавления кнопок - они будут отрисованы через React

  // Отменить скрытие кнопок
  const cancelHideButtons = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  // Запланировать скрытие кнопок
  const scheduleHideButtons = useCallback(() => {
    cancelHideButtons()
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredCell(null)
    }, 300)
  }, [cancelHideButtons])

  // Отменить скрытие кнопки таблицы
  const cancelHideTableButton = useCallback(() => {
    if (tableHideTimeoutRef.current) {
      clearTimeout(tableHideTimeoutRef.current)
      tableHideTimeoutRef.current = null
    }
  }, [])

  // Запланировать скрытие кнопки таблицы
  const scheduleHideTableButton = useCallback(() => {
    cancelHideTableButton()
    tableHideTimeoutRef.current = setTimeout(() => {
      setHoveredTable(false)
    }, 300)
  }, [cancelHideTableButton])

  // Установить курсор в ячейку
  const setCellSelection = useCallback((rowIndex: number, colIndex: number) => {
    if (!wrapperRef.current) return false

    try {
      const table = wrapperRef.current.querySelector("table")
      if (!table) return false

      const rows = table.querySelectorAll("tbody tr")
      const row = rows[rowIndex]
      if (!row) return false

      const cells = row.querySelectorAll("td, th")
      const cell = cells[colIndex] as HTMLElement
      if (!cell) return false

      const pos = editor.view.posAtDOM(cell, 0)

      if (pos !== null && pos !== undefined) {
        const resolvedPos = editor.state.doc.resolve(pos)
        const cellPos = resolvedPos.pos
        const $cell = editor.state.doc.resolve(cellPos)
        const tr = editor.state.tr
        const cellSelection = TextSelection.near($cell)
        tr.setSelection(cellSelection)
        editor.view.dispatch(tr)
        editor.view.focus()
      }
      return true
    } catch (e) {
      console.error('setCellSelection error:', e)
      return false
    }
  }, [editor])

  // Действия со строками
  const handleRowAction = useCallback((rowIndex: number, action: "addAbove" | "addBelow" | "delete") => {
    if (!isEditable) return
    setCellSelection(rowIndex, 0)
    setTimeout(() => {
      if (action === "addAbove") {
        editor.chain().focus().addRowBefore().run()
      } else if (action === "addBelow") {
        editor.chain().focus().addRowAfter().run()
      } else if (action === "delete") {
        editor.chain().focus().deleteRow().run()
      }
    }, 100)
    setOpenRowMenu(null)
  }, [editor, isEditable, setCellSelection])

  // Действия с колонками
  const handleColAction = useCallback((colIndex: number, action: "addBefore" | "addAfter" | "delete") => {
    if (!isEditable) return
    setCellSelection(0, colIndex)
    setTimeout(() => {
      if (action === "addBefore") {
        editor.chain().focus().addColumnBefore().run()
      } else if (action === "addAfter") {
        editor.chain().focus().addColumnAfter().run()
      } else if (action === "delete") {
        editor.chain().focus().deleteColumn().run()
      }
    }, 100)
    setOpenColMenu(null)
  }, [editor, isEditable, setCellSelection])

  // Действия с таблицей
  const handleTableAction = useCallback((action: "delete" | "toggleHeader") => {
    if (!isEditable) return
    
    // Выделяем первую ячейку таблицы
    setCellSelection(0, 0)
    
    setTimeout(() => {
      if (action === "delete") {
        editor.chain().focus().deleteTable().run()
      } else if (action === "toggleHeader") {
        editor.chain().focus().toggleHeaderRow().run()
      }
    }, 100)
    
    setOpenTableMenu(false)
  }, [editor, isEditable, setCellSelection])

  // Проверить, есть ли заголовки
  const hasHeaderRow = useCallback(() => {
    if (!node.firstChild) return false
    let hasHeader = false
    node.firstChild.forEach((cell) => {
      if (cell.type.name === "tableHeader") {
        hasHeader = true
      }
    })
    return hasHeader
  }, [node])

  // Отслеживание hover на ячейках
  useEffect(() => {
    if (!wrapperRef.current || !isEditable) return

    const table = wrapperRef.current.querySelector("table")
    if (!table) return

    const handleMouseEnter = (e: Event) => {
      const cell = e.target as HTMLElement
      if (cell.tagName !== "TD" && cell.tagName !== "TH") return

      cancelHideButtons()

      const row = cell.parentElement as HTMLTableRowElement
      const rowIndex = Array.from(table.querySelectorAll("tbody tr")).indexOf(row)
      const colIndex = Array.from(row.children).indexOf(cell)

      setHoveredCell({ row: rowIndex, col: colIndex })
    }

    const handleMouseLeave = () => {
      scheduleHideButtons()
    }

    const cells = table.querySelectorAll("td, th")
    cells.forEach(cell => {
      cell.addEventListener("mouseenter", handleMouseEnter)
    })

    table.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      cells.forEach(cell => {
        cell.removeEventListener("mouseenter", handleMouseEnter)
      })
      table.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [isEditable, cancelHideButtons, scheduleHideButtons, node])

  // Отслеживание hover на таблице
  useEffect(() => {
    if (!wrapperRef.current || !isEditable) return

    const table = wrapperRef.current.querySelector("table")
    if (!table) return

    const handleTableEnter = () => {
      cancelHideTableButton()
      setHoveredTable(true)
    }

    const handleTableLeave = () => {
      scheduleHideTableButton()
    }

    table.addEventListener("mouseenter", handleTableEnter)
    table.addEventListener("mouseleave", handleTableLeave)

    return () => {
      table.removeEventListener("mouseenter", handleTableEnter)
      table.removeEventListener("mouseleave", handleTableLeave)
    }
  }, [isEditable, cancelHideTableButton, scheduleHideTableButton])

  // Click outside для всех меню
  useEffect(() => {
    if (openColumnIndex === null && openRowMenu === null && openColMenu === null && !openTableMenu) return

    const handleClickOutside = (e: MouseEvent) => {
      const clickedInside = (e.target as HTMLElement).closest('.table-filter-dropdown, .table-control-menu')
      if (!clickedInside) {
        setOpenColumnIndex(null)
        setOpenRowMenu(null)
        setOpenColMenu(null)
        setOpenTableMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [openColumnIndex, openRowMenu, openColMenu, openTableMenu])

  const currentFilters = openColumnIndex !== null ? columnFilters.get(openColumnIndex) : []
  const columnCount = getColumnCount()
  const [headerRects, setHeaderRects] = useState<DOMRect[]>([])

  // Получить позиции заголовков
  useEffect(() => {
    const updateHeaderRects = () => {
      if (!wrapperRef.current) return
      
      const table = wrapperRef.current.querySelector("table")
      if (!table) return

      const firstRow = table.querySelector("tbody tr:first-child")
      if (!firstRow) return

      // Ищем и th и td (для таблиц без заголовков)
      const cells = firstRow.querySelectorAll("th, td")
      const rects = Array.from(cells).map(cell => cell.getBoundingClientRect())
      setHeaderRects(rects)
    }

    // Обновить сразу и с небольшой задержкой (для вставки из Excel)
    const timer1 = setTimeout(updateHeaderRects, 100)
    const timer2 = setTimeout(updateHeaderRects, 300)
    
    // Обновлять периодически
    const timer = setInterval(updateHeaderRects, 500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearInterval(timer)
    }
  }, [columnCount, node])

  return (
    <NodeViewWrapper className="table-filter-wrapper" ref={wrapperRef}>
      <NodeViewContent as="table" className="table-filter" />

      {/* Кнопки фильтров поверх заголовков */}
      <div className="table-filter-buttons-overlay" contentEditable={false}>
        {Array.from({ length: columnCount }).map((_, colIndex) => {
          const rect = headerRects[colIndex]
          const wrapperRect = wrapperRef.current?.getBoundingClientRect()
          
          if (!rect || !wrapperRect) return null

          // Проверяем, есть ли активные фильтры (снятые чекбоксы)
          const filters = columnFilters.get(colIndex)
          const hasActiveFilters = filters?.some(f => !f.checked) || false

          return (
            <button
              key={colIndex}
              className={`table-filter-button ${hasActiveFilters ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleFilterClick(colIndex)
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
          )
        })}
      </div>

      {openColumnIndex !== null && currentFilters && currentFilters.length > 0 && wrapperRef.current && (() => {
        const table = wrapperRef.current.querySelector("table")
        const firstRow = table?.querySelector("tbody tr:first-child")
        const cells = firstRow?.querySelectorAll("th, td")
        const cell = cells?.[openColumnIndex] as HTMLElement
        const rect = cell?.getBoundingClientRect()
        const wrapperRect = wrapperRef.current.getBoundingClientRect()
        
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
            <div className="table-filter-options">
              {currentFilters.map((filter, index) => (
                <label key={index} className="table-filter-option">
                  <input
                    type="checkbox"
                    checked={filter.checked}
                    onChange={() => toggleFilter(openColumnIndex, filter.value)}
                  />
                  <span>{filter.value === "" ? "Пустое" : filter.value}</span>
                </label>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Кнопка управления таблицей (слева сверху) */}
      {isEditable && hoveredTable && (() => {
        const table = wrapperRef.current?.querySelector("table")
        const rect = table?.getBoundingClientRect()
        const wrapperRect = wrapperRef.current?.getBoundingClientRect()
        
        if (!rect || !wrapperRect) return null

        return (
          <button
            className="table-main-control-button"
            contentEditable={false}
            onMouseEnter={cancelHideTableButton}
            onMouseLeave={scheduleHideTableButton}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setOpenTableMenu(!openTableMenu)
              setOpenRowMenu(null)
              setOpenColMenu(null)
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
        )
      })()}

      {/* Меню действий с таблицей */}
      {isEditable && openTableMenu && (() => {
        const table = wrapperRef.current?.querySelector("table")
        const rect = table?.getBoundingClientRect()
        const wrapperRect = wrapperRef.current?.getBoundingClientRect()
        
        if (!rect || !wrapperRect) return null

        const hasHeader = hasHeaderRow()

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
            <button onClick={() => handleTableAction("toggleHeader")}>
              {hasHeader ? "Убрать заголовки" : "Добавить заголовки"}
            </button>
            <button onClick={() => handleTableAction("delete")}>
              Удалить таблицу
            </button>
          </div>
        )
      })()}

      {/* Кнопки управления строками (слева) */}
      {isEditable && hoveredCell && (() => {
        const table = wrapperRef.current?.querySelector("table")
        const rows = table?.querySelectorAll("tbody tr")
        const row = rows?.[hoveredCell.row] as HTMLElement
        const rect = row?.getBoundingClientRect()
        const wrapperRect = wrapperRef.current?.getBoundingClientRect()
        
        if (!rect || !wrapperRect) return null

        return (
          <button
            className="table-row-control-button"
            contentEditable={false}
            onMouseEnter={cancelHideButtons}
            onMouseLeave={scheduleHideButtons}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setOpenRowMenu(openRowMenu === hoveredCell.row ? null : hoveredCell.row)
              setOpenColMenu(null)
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
        )
      })()}

      {/* Меню действий со строкой */}
      {isEditable && openRowMenu !== null && (() => {
        const table = wrapperRef.current?.querySelector("table")
        const rows = table?.querySelectorAll("tbody tr")
        const row = rows?.[openRowMenu] as HTMLElement
        const rect = row?.getBoundingClientRect()
        const wrapperRect = wrapperRef.current?.getBoundingClientRect()
        
        if (!rect || !wrapperRect) return null

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
        )
      })()}

      {/* Кнопки управления колонками (сверху) */}
      {isEditable && hoveredCell && (() => {
        const table = wrapperRef.current?.querySelector("table")
        const firstRow = table?.querySelector("tbody tr:first-child")
        const cells = firstRow?.querySelectorAll("th, td")
        const cell = cells?.[hoveredCell.col] as HTMLElement
        const rect = cell?.getBoundingClientRect()
        const wrapperRect = wrapperRef.current?.getBoundingClientRect()
        
        if (!rect || !wrapperRect) return null

        return (
          <button
            className="table-col-control-button"
            contentEditable={false}
            onMouseEnter={cancelHideButtons}
            onMouseLeave={scheduleHideButtons}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setOpenColMenu(openColMenu === hoveredCell.col ? null : hoveredCell.col)
              setOpenRowMenu(null)
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
        )
      })()}

      {/* Меню действий с колонкой */}
      {isEditable && openColMenu !== null && (() => {
        const table = wrapperRef.current?.querySelector("table")
        const firstRow = table?.querySelector("tbody tr:first-child")
        const cells = firstRow?.querySelectorAll("th, td")
        const cell = cells?.[openColMenu] as HTMLElement
        const rect = cell?.getBoundingClientRect()
        const wrapperRect = wrapperRef.current?.getBoundingClientRect()
        
        if (!rect || !wrapperRect) return null

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
        )
      })()}
    </NodeViewWrapper>
  )
}
