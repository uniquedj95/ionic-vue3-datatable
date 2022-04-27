export type sortType = 'asc' | 'desc' | 'none';
export interface ITableSortQuery {
  columnName: string,
  order: sortType,
  caseSensitive: boolean,
}

export interface ITableColumn {
  label: string;
  name: string;
  id?: string | number;
  visibility?: boolean;
  sortable?: boolean;
  initialSort?: boolean;
  initialSortOrder?: sortType;
  sortCaseSensitive?: boolean;
  columnClasses?: string | Array<string>;
  rowClasses?: string | Array<string>;
  rowTextAlignment?: string;
  columnTextAlignment?: string;
  uniqueId?: boolean;
}

export interface ITableConfig {
  paginated?: boolean;
  paginationInfo?: boolean;
  visibleButtons?: number;
  perPageItems?: number;
  currentPage?: number;
  highlightRowHover?: boolean;
  rowsSelectable?: boolean;
  multiColumnSort?: boolean;
  highlightRowHoverColor?: string;
  perPageOptions?: Array<number>;
  serverMode?: boolean;
  selectedRowsInfo?: boolean;
  preservePageOnDataChange?: boolean;
}

export interface ITableClasses {
  tableWrapper?: string | Array<string>;
  table?: string | Array<string>;
  row?: string | Array<string>;
  cell?: string | Array<string>;
}

export interface ITableActionsBtn {
  icon: string;
  label: string;
  class: string;
  eventName: string;
  eventPayload?: Record<string, any>;
}

export interface ITableFilter {
  name: string;
  type?: string;
  placeholder?: string;
  visible?: boolean;
  caseSensitive?: boolean;
  showClearButton?: boolean;
  CSSClass?: string;
  filterOnPressEnter?: boolean;
  debounceRate?: number;
  initValue?: string | number;
  handler: (filter: string | number | Array<string| number>) => void;
}

import {
  cloneDeep,
  orderBy,
  get,
  omit,
  clone,
  isArray,
} from "lodash";
import {
  computed,
  defineComponent,
  h,
  onMounted,
  PropType,
  Ref,
  ref,
  watch,
} from "vue";
import { canShowColumn, getCellCSSClassess, getRowValue, isSortableColumn } from "@/utils/Table";
import { IonButton, IonCol, IonGrid, IonIcon, IonInput, IonItem, IonLabel, IonRow, IonSelect, IonSelectOption } from "@ionic/vue";
import { swapVertical, arrowUp, arrowDown} from 'ionicons/icons';
import { generateRange } from "@/utils/Numbers";

export default defineComponent({
  name: "DataTable",
  props: {
    rows: {
      type: Object as PropType<any[]>,
      required: true,
    },
    columns: {
      type: Object as PropType<ITableColumn[]>,
      required: true,
    },
    config: {
      type: Object as PropType<ITableConfig>,
      default: () => ({}),
    },
    classes: {
      type: Object as PropType<ITableClasses>,
      default: () => ({}),
    },
    actions: {
      type: Object as PropType<ITableActionsBtn[]>,
      default: () => [] as Array<ITableActionsBtn>,
    },
  },
  setup(props, { emit }) {
    const cRows = ref(cloneDeep(props.rows));
    const currentPage = ref(props.config.currentPage || 1);
    const perPageItems = ref(props.config.perPageItems || 10);
    const filteredRows = ref<any[]>([]);
    const totalRows = computed(() => props.rows.length);
    const totalFilteredRows = computed(() =>
      serverMode.value ? totalRows.value : filteredRows.value.length
    );
    const serverMode = ref(get(props.config, "serverMode", false));
    const multiColumnSort = ref(get(props.config, "multiColumnSort", false));
    const highlightRowHover = ref(get(props.config, "highlightRowHover", true));
    const preservePageOnDataChange = computed<boolean>(() =>
      get(props.config, "preservePageOnDataChange", false)
    );
    const isPaginated = computed(() => props?.config?.paginated !== undefined ? props.config.paginated : true);
    const visibleButtons = computed(() => props.config.visibleButtons || 7);
    const perPageOptions = computed(
      () => props.config.perPageOptions || [5, 10, 15]
    );

    const cColumns = computed(() => {
      return props.columns.map((column, index) => {
        column.id = index + 1;
        return column;
      });
    });

    const highlightRowHoverColor = computed(() => {
      return highlightRowHover.value
        ? get(props.config, "highlightRowHoverColor", "#d6d6d6")
        : "";
    });

    const headerColSpan = computed(() => cColumns.value.filter((column) => canShowColumn(column)).length);

    const tableClasses = computed(() => {
      let classes = "table ";
      if (typeof props.classes.table === "string") {
        classes += props.classes.table;
      } else if (isArray(props.classes.table)) {
        classes += props.classes.table.toString().replace(",", " ");
      }
      return classes;
    });

    const sortQuery = ref<ITableSortQuery[]>([]);

    const isSortCaseSensitive = (column: ITableColumn) => {
      return get(column, "sortCaseSensitive", true);
    };

    const initialSort = () => {
      cColumns.value
        .filter((column) => !!column.initialSort)
        .some((column) => {
          const result = sortQuery.value.findIndex(({columnName}) => columnName === column.name);
          if (result === -1) {
            sortQuery.value.push({
              columnName: column.name,
              order: column.initialSortOrder || "asc",
              caseSensitive: isSortCaseSensitive(column),
            });
          }
          if (!multiColumnSort.value) {
            return true;
          }
        });
    };

    const paginateFilter = () => {
      if (isPaginated.value) {
        const startPage = (currentPage.value - 1) * perPageItems.value;
        const endPage = startPage + perPageItems.value;
        cRows.value = filteredRows.value.slice(startPage, endPage);
      } else {
        cRows.value = cloneDeep(filteredRows.value);
      }
    };

    const updateSortQuery = (column: ITableColumn) => {
      const result = sortQuery.value.findIndex(({columnName}) => columnName === column.name);
      if (result === -1) {
        if (!multiColumnSort.value) {
          sortQuery.value = [];
        }
        sortQuery.value.push({
          columnName: column.name,
          order: "asc",
          caseSensitive: isSortCaseSensitive(column),
        });
      } else {
        sortQuery.value[result].order =
        sortQuery.value[result].order == "asc" ? "desc" : "asc";
      }
    };

    const resetSort = () => {
      sortQuery.value = [];
    };

    const sort = () => {
      if (sortQuery.value.length > 0) {
        const orders = sortQuery.value.map((sortConfig) => sortConfig.order);
        filteredRows.value = orderBy(
          filteredRows.value,
          sortQuery.value.map((sortConfig) => {
            return (row) => {
              const value = get(row, sortConfig.columnName);
              if (sortConfig.caseSensitive) return value !== null ? value : "";
              return value !== null ? value.toString().toLowerCase() : "";
            };
          }),
          orders as any
        );
      }
      paginateFilter();
    };

    const emitQueryParams = (page = null as null | number) => {
      if (serverMode.value) {
        const queryParams = cloneDeep(sortQuery.value);
        const sort = queryParams.map((o) => omit(o, "id"));
        const itemsPerPage = clone(perPageItems.value);

        if (page === null) {
          if (preservePageOnDataChange.value) {
            page = currentPage.value;
          } else {
            currentPage.value = 1;
            page = 1;
          }
        }
        const payload = {
          sort: sort,
          perPageItems: itemsPerPage,
          currentPage: page,
        };
        emit("changeQuery", payload);
      }
    };

    const startPage = ref(currentPage.value);
    const endPage = ref(0);

    const fromEntries = computed(() => {
      if (currentPage.value === 1) return 1
      return (currentPage.value * perPageItems.value) - (perPageItems.value - 1)
    })

    const endOfEntries = computed(() => {
      if (currentPage.value === totalPages.value) return totalFilteredRows.value
      return currentPage.value * perPageItems.value
    })
    const range = computed(() => generateRange(startPage.value, endPage.value + 1));
    const totalPages = computed(() => Math.ceil(totalFilteredRows.value / perPageItems.value));
    const perPageHandler = (option: any) => emit("updatePerPageItems", option)

    const pageHandler = (index: number) => {
      if (index >= 1 && index <= totalPages.value) {
        emit("updateCurrentPage", index);
      }
    };

    const calculatePageRange = (force = false) => {
      //Skip calculating if all pages can be shown
      if (totalPages.value <= visibleButtons.value) {
        startPage.value = 1;
        endPage.value = totalPages.value;
        return;
      }

      //Skip recalculating if the previous and next pages are already visible
      if (
        !force &&
        (range.value.includes(currentPage.value - 1) ||
          currentPage.value === 1) &&
        (range.value.includes(currentPage.value + 1) ||
          currentPage.value === totalPages.value)
      ) {
        return;
      }

      //Current page is the start page minus one
      startPage.value = currentPage.value === 1 ? 1 : currentPage.value - 1;

      //Reserved entries: firstpage, ellipsis (2x), prev. page, last page, current page
      endPage.value = startPage.value + visibleButtons.value - 5;

      //If the user navigates on page one or two, we set start to one (ellipsis pointless)
      //and can potentially shift up end
      if (startPage.value <= 3) {
        endPage.value += 3 - startPage.value;
        startPage.value = 1;
      }

      //If the user navigates on the last two pages or out of bounds, we can shift down start
      //This will also handle end overflow, substract 2 for ellipsis and last page
      if (endPage.value >= totalPages.value - 2) {
        startPage.value -= endPage.value - (totalPages.value - 2);
        endPage.value = totalPages.value;
      }

      //Handle start underflow
      startPage.value = Math.max(startPage.value, 1);
    };

    watch(sortQuery, () => serverMode.value ? emitQueryParams() : sort());

    watch(perPageItems, () => {
      if (!serverMode.value) {
        currentPage.value = 1;
        paginateFilter();
      } else {
        emitQueryParams();
      }
    });

    watch(isPaginated, () => {
      if (!serverMode.value) {
        paginateFilter();
      } else {
        emitQueryParams();
      }
    });

    watch(
      () => props.rows,
      () => {
        if (preservePageOnDataChange.value) {
          const predictedTotalPage = Math.ceil(
            totalFilteredRows.value / perPageItems.value
          );
          if (predictedTotalPage !== 0) {
            currentPage.value =
              currentPage.value <= predictedTotalPage
                ? currentPage.value
                : predictedTotalPage;
          } else {
            currentPage.value = 1;
          }
        }
      },
      {
        deep: true,
      }
    );

    watch([currentPage, totalPages], () => {
      paginateFilter();
      calculatePageRange();
    });

    watch(() => props.config.multiColumnSort, () => resetSort());

    onMounted(() => {
      initialSort();
      calculatePageRange(true)
    });

    return () => h(
      "div", { class: 'table-responsive' + props.classes.tableWrapper, style: { margin: ".4rem" } }, h(
        "table", { class: tableClasses.value }, [
          h('thead', 
            h('tr',
              cColumns.value.map((column) => {
                if(canShowColumn(column)) {
                  const isSortable = isSortableColumn(column)
                  return h(
                    'th', { 
                      onClick: () => isSortable ? updateSortQuery(column) : null,
                      style: { cursor: isSortable ? "pointer" : "default" }
                    }, 
                    [
                      h('span', column.label),
                      isSortable && h(IonIcon, { 
                        icon: (computed(() => {
                          const q = sortQuery.value.find(({columnName}) => columnName === column.name);
                          return !q ? swapVertical : q.order == "asc" ? arrowUp : arrowDown;
                        })).value, 
                        style: { 
                          marginRight: "5px", 
                          float: "right",
                          cursor: 'pointer'
                        } 
                      })
                    ]
                  )
                }
              })
            )
          ),
          h('tbody', [
            cRows.value.map((row, key) => {
              const rowRef = ref() as Ref<HTMLElement>;
              return h(
                'tr', 
                {
                  key,
                  ref: rowRef,
                  'data-id': row.rowId, 
                  class: (computed(() => {
                    return isArray(props.classes.row) && props.classes.row.length > 0
                        ? props.classes.row.toString().replace(",", " ")
                        : props.classes.row;
                  })).value, 
                  onMouseEnter: () => {
                    rowRef.value.style.background =  highlightRowHoverColor.value
                    rowRef.value.style.cursor = 'pointer'
                  },
                  onMouseLeave: () => {
                    rowRef.value.style.background =  ''
                    rowRef.value.style.cursor = ''
                  }
                },
                props.columns.map((column, index) => canShowColumn(column) && h(
                  'td', {
                    key: index,
                    class: getCellCSSClassess(column, props.classes.cell)
                  },
                  getRowValue(row, column.name)
                ))
              )
            }),
            cRows.value.length === 0 && h(
              'tr', h(
                'td', { colspan: headerColSpan.value }, h(
                  'div', { class: 'empty-results' }, "No data found"
                )
              )
            ),
            isPaginated.value && h(
              'tr', { class: 'pagination-row' }, h(
                'td', { colspan: headerColSpan.value }, h(
                  IonGrid, h(
                    IonRow, [
                      h(IonCol, { size: "8" }, h(
                        "div", { class: "pagination" }, h(
                          "div", { class: "btn-group" }, [
                          h(IonButton, { color: "light", disabled: currentPage.value === startPage.value, onClick: () => pageHandler(currentPage.value - 1) }, h(
                            'span', { style: { fontSize: '28px'}}, "«"
                          )),
                          totalFilteredRows.value === 0
                            ? h(IonButton, { disabled: true }, "...")
                            : h('div', [
                              startPage.value > 3 && h(IonButton, { color: "light", onClick: () => pageHandler(1) }, 1),
                              startPage.value > 3 && h(IonButton, { color: "light", disabled: true }, '...'),
                              range.value.map(index => h(IonButton, { key: index, color: index === currentPage.value ? "primary" : "light", onClick: () => pageHandler(index) }, index)),
                              endPage.value < (totalPages.value - 2) && h(IonButton, { color: "light", disabled: true }, '...'),
                              endPage.value < (totalPages.value - 2) && h(IonButton, { color: "light", onClick: () => pageHandler(totalPages.value) }, totalPages.value),
                            ]),
                          h(IonButton, { color: "light", disabled: currentPage.value === endPage.value, onClick: () => pageHandler(currentPage.value + 1) },  h(
                            'span', { style: { fontSize: '28px'}}, "»"
                          )),
                          h(IonItem, { class: "box", lines: "none", style: { '--min-height': '11px', marginLeft: '.5rem' } }, [
                            h(IonLabel, "Go to page"),
                            h(IonInput, {
                              type: "number",
                              min: 1,
                              max: totalPages.value,
                              value: currentPage.value,
                              style: { maxWidth: '45px' },
                              debounce: 200,
                              onIonChange: (e: Event) => pageHandler(parseInt((e.target as HTMLInputElement).value))
                            }),
                          ]),
                          h(IonItem, { class: "box", lines: "none", style: { '--min-height': '11px', marginLeft: '.5rem' } }, [
                            h(IonLabel, "Items per page"),
                            h(
                              IonSelect,
                              { value: perPageItems.value, onIonChange: (e: Event) => perPageHandler(parseInt((e.target as HTMLInputElement).value)) },
                              perPageOptions.value.map((option, index) => h(IonSelectOption, { value: option, key: index }, option))
                            ),
                          ]),
                        ]
                        )
                      )),
                      h(IonCol, { size: "4", style: { marginTop: '1rem', textAlign: 'right'} }, totalFilteredRows.value
                        ? `Showing ${fromEntries.value} to ${endOfEntries.value} of ${totalFilteredRows.value} entries`
                        : "No results found"
                      )
                    ]
                  )
                )
              )
            )
          ]),
        ]
      )
    )
  },
});