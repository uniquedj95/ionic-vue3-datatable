export interface ISelectAllCheckbox {
  visibility: boolean;
  text: string;
}

export interface ITableColumnFilter {
  type: "simple" | "select" | "custom";
  placeholder: string;
  selectedText?: string;
  slotName?: string;
  showClearButton?: boolean;
  filterOnPressEnter?: boolean;
  debounceRate?: number;
  options?: Array<any>;
  mode?: "multi" | "single";
  closeDropdownOnSelection?: boolean;
  selectAllCheckbox?: ISelectAllCheckbox;
  validator?: (rowValue: any, filterText: string) => boolean;
  init?: {
    value: any;
  };
}

export interface ITableFilterQuery {
  sort: Array<any>;
  filters: Array<any>;
  globalSearch: string;
}

export interface ITableColumn {
  label: string;
  name: string;
  id?: string | number;
  visibility?: boolean;
  filter?: ITableColumnFilter;
  sortable?: boolean;
  initialSort?: boolean;
  initialSortOrder?: "asc" | "desc" | "none";
  sortCaseSensitive?: boolean;
  columnClasses?: string | Array<string>;
  rowClasses?: string | Array<string>;
  rowTextAlignment?: string;
  columnTextAlignment?: string;
  uniqueId?: boolean;
}

export interface IGlobalSearchConfig {
  placeholder: string;
  visibility?: boolean;
  caseSensitive?: boolean;
  showClearButton?: boolean;
  class?: string;
  searchOnPressEnter?: boolean;
  searchDebounceRate?: number;
  init?: {
    value: any;
  };
}

export interface ITableConfig {
  pagination?: boolean;
  paginationInfo?: boolean;
  visibleButtons?: number;
  perPageItems?: number;
  currentPage?: number;
  checkboxRows?: boolean;
  highlightRowHover?: boolean;
  rowsSelectable?: boolean;
  multiColumnSort?: boolean;
  highlightRowHoverColor?: string;
  globalSearch?: IGlobalSearchConfig;
  perPageOptions?: Array<number>;
  showResetButton?: boolean;
  showRefreshButton?: boolean;
  serverMode?: boolean;
  selectedRowsInfo?: boolean;
  preservePageOnDataChange?: true;
}

export interface ITableCSSClasses {
  tableWrapper?: string;
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

export interface ITableCustomFilter {
  name: string;
  text: any;
  type: string;
}

import {
  cloneDeep,
  orderBy,
  get,
  omit,
  clone,
  findIndex,
  isArray,
} from "lodash";
import TableRow from "./TableRow";
import Pagination from "./Pagination";
import {
  computed,
  defineComponent,
  h,
  nextTick,
  onMounted,
  PropType,
  reactive,
  ref,
  watch,
} from "vue";
import { canShowColumn, getColumnCSSClasses } from "@/utils/Table";
import TableColumn from "./TableColumn";

export default defineComponent({
  name: "DataTable",
  components: {
    TableRow,
    Pagination,
    TableColumn,
  },
  props: {
    rows: {
      type: Object as PropType<any[]>,
      required: true,
    },
    columns: {
      type: Object as PropType<ITableColumn[]>,
      required: true,
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    showLoader: {
      type: Boolean,
      default: false,
    },
    config: {
      type: Object as PropType<ITableConfig>,
      default: () => ({}),
    },
    classes: {
      type: Object as PropType<ITableCSSClasses>,
      default: () => ({}),
    },
    actions: {
      type: Object as PropType<ITableActionsBtn[]>,
      default: () => [] as Array<ITableActionsBtn>,
    },
    customFilters: {
      type: Object as PropType<ITableColumnFilter[]>,
      ddefault: () => [],
    },
  },
  setup(props, { emit }) {
    const cRows = ref(cloneDeep(props.rows));
    const currentPage = ref(props.config.currentPage || 1);
    const perPageItems = ref(props.config.perPageItems || 10);
    const tempFilteredResults = ref<any[]>([]);
    const totalRows = computed(() => props.rows.length);
    const totalFilteredRows = computed(() =>
      serverMode.value ? totalRows.value : tempFilteredResults.value.length
    );
    const isFirstTime = ref(true);
    const canEmitQueries = ref(false);
    const serverMode = ref(get(props.config, "serverMode", false));
    const multiColumnSort = ref(get(props.config, "multiColumnSort", false));
    const highlightRowHover = ref(get(props.config, "highlightRowHover", true));
    const preservePageOnDataChange = computed<boolean>(() =>
      get(props.config, "preservePageOnDataChange", false)
    );
    const pagination = computed(() => get(props.config, "pagination", true));
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

    const headerColSpan = computed(() => {
      let count = 0;
      count += cColumns.value.filter((column) => canShowColumn(column)).length;
      return count;
    });


    const tableClasses = computed(() => {
      let classes = "table ";
      if (typeof props.classes.table === "string") {
        classes += props.classes.table;
      } else if (isArray(props.classes.table)) {
        classes += props.classes.table.toString().replace(",", " ");
      }
      return classes;
    });

    const originalRows = computed(() =>
      cRows.value.map((row, i) => {
        row.rowId = i + 1;
        return row;
      })
    );

    const filterQuery = reactive<ITableFilterQuery>({
      sort: [],
      filters: [],
      globalSearch: "",
    });

    const isSortCaseSensitive = (column: ITableColumn) => {
      return get(column, "sortCaseSensitive", true);
    };

    const initialSort = () => {
      cColumns.value
        .filter((column) => !!column.initialSort)
        .some((column) => {
          const result = findIndex(filterQuery.sort, { name: column.name });
          if (result === -1) {
            const initialSortOrder = get(column, "initialSortOrder", "asc");
            filterQuery.sort.push({
              name: column.name,
              order: initialSortOrder,
              caseSensitive: isSortCaseSensitive(column),
            });
          }
          if (!multiColumnSort.value) {
            return true;
          }
        });
    };

    const paginateFilter = () => {
      if (pagination.value) {
        const start = (currentPage.value - 1) * perPageItems.value;
        const end = start + perPageItems.value;
        cRows.value = tempFilteredResults.value.slice(start, end);
      } else {
        cRows.value = cloneDeep(tempFilteredResults.value);
      }
    };

    const updateSortQuery = (column: ITableColumn) => {
      const result = findIndex(filterQuery.sort, {
        name: column.name,
      });

      if (result === -1) {
        if (!multiColumnSort.value) {
          filterQuery.sort = [];
        }
        filterQuery.sort.push({
          name: column.name,
          order: "asc",
          caseSensitive: isSortCaseSensitive(column),
        });
      } else {
        filterQuery.sort[result].order =
          filterQuery.sort[result].order == "asc" ? "desc" : "asc";
      }
    };

    const resetSort = () => {
      filterQuery.sort = [];
      filter(!preservePageOnDataChange.value);
    };

    const sort = () => {
      if (filterQuery.sort.length !== 0) {
        const orders = filterQuery.sort.map((sortConfig) => sortConfig.order);
        tempFilteredResults.value = orderBy(
          tempFilteredResults.value,
          filterQuery.sort.map((sortConfig) => {
            return (row) => {
              const value = get(row, sortConfig.name);
              if (sortConfig.caseSensitive) return value !== null ? value : "";
              return value !== null ? value.toString().toLowerCase() : "";
            };
          }),
          orders
        );
      }
      paginateFilter();
    };

    const emitQueryParams = (page = null as null | number) => {
      if (serverMode.value && canEmitQueries.value) {
        const queryParams = cloneDeep(filterQuery);
        const sort = queryParams.sort.map((o) => omit(o, "id"));
        const filters = queryParams.filters.map((o) => omit(o, "config"));
        const globalSearch = queryParams.globalSearch;
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
          filters: filters,
          globalSearch: globalSearch,
          perPageItems: itemsPerPage,
          currentPage: page,
        };
        emit("changeQuery", payload);
      }
    };

    const handleShiftKey = () => {
      ["keyup", "keydown"].forEach((event) => {
        window.addEventListener(event, (e: any) => {
          document.onselectstart = function () {
            return !(e.key === "Shift" && e.shiftKey === true);
          };
        });
      });
    };

    const filter = (resetPage = true, isInit = false) => {
      const res = originalRows.value.filter((row) => {
        let flag = true;
        filterQuery.filters.some((filter) => {
          if (filter.type === "custom") {
            const index = findIndex(cColumns.value, { name: filter.name });
            if (index > -1) {
              const column = cColumns.value[index];
              if (column.filter?.validator) {
                const result = column.filter.validator(
                  get(row, filter.name),
                  filter.text
                );
                if (result == true || result == undefined) {
                  flag = true;
                } else {
                  flag = false;
                  return true;
                }
              } else {
                flag = true;
              }
            } else {
              flag = true;
            }
          }
        });
        return flag;
      });

      tempFilteredResults.value = res;

      sort();
      if (resetPage || totalFilteredRows.value === 0) {
        currentPage.value = 1;
      } else if (!isInit) {
        const newTotalPage = Math.ceil(
          totalFilteredRows.value / perPageItems.value
        );
        currentPage.value =
          currentPage.value <= newTotalPage ? currentPage.value : newTotalPage;
      }
    };

    watch(
      [filterQuery.filters, filterQuery.globalSearch],
      () => {
        if (!serverMode.value) {
          filter(!preservePageOnDataChange.value);
        }
      },
      { deep: true }
    );

    watch(filterQuery, () => serverMode.value ? emitQueryParams() : sort(), {
      deep: true
    });

    watch(perPageItems, () => {
      if (!serverMode.value) {
        currentPage.value = 1;
        paginateFilter();
      } else {
        emitQueryParams();
      }
    });

    watch(pagination, () => {
      if (!serverMode.value) {
        paginateFilter();
      } else {
        emitQueryParams();
      }
    });

    watch(
      () => props.rows,
      () => {
        if (!serverMode.value) {
          filter(!preservePageOnDataChange.value, !isFirstTime.value);
        } else {
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
        }
        isFirstTime.value = false;
      },
      {
        deep: true,
      }
    );

    watch(
      () => props.customFilters,
      (newVal) => {
        if (!serverMode.value && newVal) {
          newVal.forEach((customFilter: any) => {
            if (customFilter.name) {
              const index = filterQuery.filters.findIndex(
                (filter) => filter.name === customFilter.name
              );
              if (index === -1) {
                filterQuery.filters.push(customFilter);
              } else {
                filterQuery.filters[index].text = customFilter.text;
              }
            }
          });
        }
      },
      { deep: true }
    );

    watch(currentPage, (newVal) => {
      if (!serverMode.value) {
        paginateFilter();
      } else {
        emitQueryParams(newVal);
      }
    });

    watch(
      () => props.config.multiColumnSort,
      () => resetSort()
    );

    onMounted(() => {
      initialSort();

      nextTick(() => {
        if (!serverMode.value) {
          filter(false, true);
        } else {
          canEmitQueries.value = true;
          emitQueryParams();
        }
      });

      handleShiftKey();
    });

    return () => h(
      "div", { class: 'table-responsive' + props.classes.tableWrapper, style: { margin: ".4rem" } }, h(
        "table", { class: tableClasses.value }, [
        h('thead', h('tr',
          cColumns.value.map((column, key) => canShowColumn(column) && h(
            TableColumn, {
            key,
            column,
            filterQuery,
            class: getColumnCSSClasses(column),
            onUpdateSort: () => updateSortQuery(column),
          }
          ))
        )),
        h('tbody', [
          cRows.value.map((row, key) => h(TableRow, {
            key,
            row,
            rowIndex: key,
            columns: cColumns.value,
            highlightRowHover: highlightRowHover.value,
            highlightRowHoverColor: highlightRowHoverColor.value,
            globalRowCSSClasses: props.classes.row,
            globalCellCSSClasses: props.classes.cell,
          })),
          cRows.value.length === 0 && h(
            'tr', h(
              'td', { colspan: headerColSpan.value }, h(
                'div', { class: 'empty-results' }, "No data found"
              )
            )
          ),
          pagination.value && h(
            'tr', { class: 'pagination-row' }, h(
              'td', { colspan: headerColSpan.value }, h(
                Pagination, {
                currentPage: currentPage.value,
                total: totalFilteredRows.value,
                perPageItems: perPageItems.value,
                perPageOptions: perPageOptions.value,
                visibleButtons: visibleButtons.value,
                onUpdateCurrentPage: (newPage) => currentPage.value = newPage,
                onUpdatePerPageItems: (newPerPageItems) => perPageItems.value = newPerPageItems,
              }
              )
            )
          )
        ]),
      ]
      )
    )
  },
});