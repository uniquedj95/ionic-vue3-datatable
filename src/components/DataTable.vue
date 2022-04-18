<template>
  <div :class="tableWrapperClasses">
    <table class="table" :class="tableClasses">
      <thead>
        <tr>
          <template v-for="(column, index) in cColumns">
            <TableColumnVue
              v-if="canShowColumn(column)"
              :key="index"
              :column="column"
              class="column-header"
              :class="columnClasses(column)"
              @updateSort="updateSortQuery(column)"
            />
          </template>
        </tr>
      </thead>
      <tbody>
        <!-- data rows stars here -->
        <table-row
          v-for="(row, index) in cRows"
          :key="index"
          :row="row"
          :columns="cColumns"
          :rowIndex="index"
          :highlightRowHover="highlightRowHover"
          :highlightRowHoverColor="highlightRowHoverColor"
          :propRowClasses="classes.row"
          :propCellClasses="classes.cell"
        ></table-row>

        <tr v-show="cRows.length === 0">
          <td :colspan="headerColSpan">
            <div class="empty-results">No results found</div>
          </td>
        </tr>

        <tr v-if="showPaginationRow" class="footer-pagination-row">
          <td :colspan="headerColSpan">
            <pagination
              v-if="pagination"
              :currentPage="currentPage"
              :perPageItems="perPageItems"
              :perPageOptions="perPageOptions"
              :total="totalFilteredRows"
              :visibleButtons="visibleButtons"
              :totalOriginalRows="totalOriginalRows"
              :showSelectedRowsInfo="showSelectedRowsInfo"
              @updatePerPageItems="updatePerPageItems"
              @updateCurrentPage="updateCurrentPage"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import {
  cloneDeep,
  orderBy,
  get,
  omit,
  clone,
  has,
  findIndex,
  isArray,
} from "lodash";
import TableRow from "./TableRow.vue";
import SelectAllRowsCheckbox from "./SelectAllRowsCheckBox.vue";
import Pagination from "./CustomPagination.vue";
import {
  computed,
  defineComponent,
  nextTick,
  onMounted,
  PropType,
  ref,
  watch,
} from "vue";
import {
  GlobalSearchConfig,
  TableActionsBtn,
  TableColumn,
  TableColumnFilter,
  TableConfig,
  TableCSSClasses,
  TableFilterQuery,
} from "@/interfaces/datatable";
import { closeCircle } from "ionicons/icons";
import { canShowColumn, isSortableColumn } from "@/utils/Table";
import TableColumnVue from "./TableColumn.vue";

export default defineComponent({
  props: {
    rows: {
      type: Object as PropType<any[]>,
      required: true,
    },
    columns: {
      type: Object as PropType<TableColumn[]>,
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
      type: Object as PropType<TableConfig>,
      default: () => ({}),
    },
    classes: {
      type: Object as PropType<TableCSSClasses>,
      default: () => ({}),
    },
    actions: {
      type: Object as PropType<TableActionsBtn[]>,
      default: () => [] as Array<TableActionsBtn>,
    },
    customFilters: {
      type: Object as PropType<TableColumnFilter[]>,
      ddefault: () => [],
    },
  },
  // emits: ["resetQuery", "selectRow", "unselectRow", "selectAllRows", "unselectAllRows", "changeQuery"] as keyof TableActionsBtn.eventName,
  setup(props, { emit }) {
    const cRows = ref(cloneDeep(props.rows));
    const currentPage = ref(props.config.currentPage || 1);
    const updateCurrentPage = (page: number) => (currentPage.value = page);
    const perPageItems = ref(props.config.perPageItems || 10);
    const updatePerPageItems = (value: number) => (perPageItems.value = value);
    const tempFilteredResults = ref<any[]>([]);
    const totalRows = computed(() => props.rows.length);
    const totalCurrentPageRows = computed(() => cRows.value.length)
    const totalFilteredRows = computed(() =>
      serverMode.value ? totalRows.value : tempFilteredResults.value.length
    );
    const totalFilteredResults = computed(
      () => tempFilteredResults.value.length
    );
    const totalOriginalRows = computed(() =>
      serverMode.value ? totalFilteredRows.value : props.rows.length
    );
    const isFirstTime = ref(true);
    const isResponsive = ref(true);
    const canEmitQueries = ref(false);
    const serverMode = ref(get(props.config, "serverMode", false));
    const multiColumnSort = ref(get(props.config, "multiColumnSort", false));
    const showPaginationInfo = ref(get(props.config, "paginationInfo", true));
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

    const globalSearch = ref<GlobalSearchConfig>({
      placeholder: get(
        props.config,
        "globalSearch.placeholder",
        "Enter search text"
      ),
      visibility: get(props.config, "globalSearch.visibility", true),
      caseSensitive: get(props.config, "globalSearch.caseSensitive", false),
      showClearButton: get(props.config, "globalSearch.showClearButton", true),
      searchOnPressEnter: get(
        props.config,
        "globalSearch.searchOnPressEnter",
        false
      ),
      searchDebounceRate: get(
        props.config,
        "globalSearch.searchDebounceRate",
        60
      ),
      class: get(props.config, "globalSearch.class", ""),
      init: get(props.config, "globalSearch.init.value", ""),
    });

    const showPaginationRow = computed(() => {
      return (
        pagination.value ||
        showPaginationInfo.value 
      );
    });

    const tableClasses = computed(() => {
      let classes = "";
      if (typeof props.classes.table === "string") {
        classes += props.classes.table;
      } else if (isArray(props.classes.table)) {
        classes += props.classes.table.toString().replace(",", " ");
      }
      return classes;
    });

    const tableWrapperClasses = computed(() =>
      get(props.classes, "tableWrapper", "table-responsive")
    );

    const originalRows = computed(() =>
      cRows.value.map((row, i) => {
        row.rowId = i + 1;
        return row;
      })
    );

    const query = ref<TableFilterQuery>({
      sort: [],
      filters: [],
      globalSearch: "",
    });

    const isSortCaseSensitive = (column: TableColumn) => {
      return get(column, "sortCaseSensitive", true);
    };

    const initialSort = () => {
      cColumns.value
        .filter((column) => !!column.initialSort)
        .some((column) => {
          let result = findIndex(query.value.sort, { id: column.id });
          if (result === -1) {
            const initialSortOrder = get(column, "initialSortOrder", "asc");
            query.value.sort.push({
              id: column.id,
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
        let start = (currentPage.value - 1) * perPageItems.value;
        let end = start + perPageItems.value;
        cRows.value = tempFilteredResults.value.slice(start, end);
      } else {
        cRows.value = cloneDeep(tempFilteredResults.value);
      }
    };

    const updateSortQuery = (column: TableColumn) => {
      let result = findIndex(query.value.sort, {
        id: column.id,
      });

      if (result === -1) {
        if (!multiColumnSort.value) {
          query.value.sort = [];
        }
        query.value.sort.push({
          id: column.id,
          name: column.name,
          order: "asc",
          caseSensitive: isSortCaseSensitive(column),
        });
      } else {
        query.value.sort[result].order =
          query.value.sort[result].order == "asc" ? "desc" : "asc";
      }
    };

    const resetSort = () => {
      query.value.sort = [];
      filter(!preservePageOnDataChange.value);
    };

    const sort = () => {
      if (query.value.sort.length !== 0) {
        let orders = query.value.sort.map((sortConfig) => sortConfig.order);
        tempFilteredResults.value = orderBy(
          tempFilteredResults.value,
          query.value.sort.map((sortConfig) => {
            return (row) => {
              let value = get(row, sortConfig.name);
              if (sortConfig.caseSensitive) return value !== null ? value : "";
              return value !== null ? value.toString().toLowerCase() : "";
            };
          }),
          orders
        );
      }
      paginateFilter();
    };

    const getCellSlotName = (column: TableColumn) => {
      return get(column, "slotName") || column.name.replace(/\./g, "_");
    };

    const emitQueryParams = (page = null as null | number) => {
      if (serverMode.value && canEmitQueries.value) {
        let queryParams = cloneDeep(query.value);
        let sort = queryParams.sort.map((o) => omit(o, "id"));
        let filters = queryParams.filters.map((o) => omit(o, "config"));
        let globalSearch = queryParams.globalSearch;
        let itemsPerPage = clone(perPageItems.value);

        if (page === null) {
          if (preservePageOnDataChange.value) {
            page = currentPage.value;
          } else {
            currentPage.value = 1;
            page = 1;
          }
        }
        let payload = {
          sort: sort,
          filters: filters,
          globalSearch: globalSearch,
          perPageItems: itemsPerPage,
          currentPage: page,
        };
        emit("changeQuery", payload);
      }
    };

    const columnClasses = (column: TableColumn) => {
      let classes = "";
      const alignments = [
        "text-justify",
        "text-right",
        "text-left",
        "text-center",
      ];
      classes +=
        column.columnTextAlignment &&
        alignments.includes(column.columnTextAlignment)
          ? column.columnTextAlignment
          : "text-center";

      if (has(column, "columnClasses")) {
        classes = classes + " " + column.columnClasses;
      }
      if (isSortableColumn(column)) {
        classes = classes + " sort-cursor";
      }

      return classes;
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

    const emitActionEvent = (action: TableActionsBtn) => {
      let payload: Record<string, any> = {
        eventPayload: cloneDeep(action.eventPayload),
      };

      emit(action.eventName, payload);
    };

    const filter = (resetPage = true, isInit = false) => {
      let res = originalRows.value.filter((row) => {
        let flag = true;
        query.value.filters.some((filter) => {
           if (filter.type === "custom") {
            let index = findIndex(cColumns.value, { name: filter.name });
            if (index > -1) {
              let column = cColumns.value[index];
              if (column.filter?.validator) {
                let result = column.filter.validator(
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
        let newTotalPage = Math.ceil(
          totalFilteredRows.value / perPageItems.value
        );
        currentPage.value =
          currentPage.value <= newTotalPage ? currentPage.value : newTotalPage;
      }
    };

    watch(
      [query.value.filters, query.value.globalSearch],
      () => {
        if (!serverMode.value) {
          filter(!preservePageOnDataChange.value);
        }
      },
      { deep: true }
    );

    watch(
      query.value.sort,
      () => {
        if (!serverMode.value) {
          sort();
        }
      },
      { deep: true }
    );

    watch(query, () => {
      if (serverMode.value) emitQueryParams(), { deep: true };
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
            let predictedTotalPage = Math.ceil(
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
              let index = query.value.filters.findIndex(
                (filter) => filter.name === customFilter.name
              );
              if (index === -1) {
                query.value.filters.push(customFilter);
              } else {
                query.value.filters[index].text = customFilter.text;
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

    return {
      closeCircle,
      cRows,
      cColumns,
      query,
      currentPage,
      perPageItems,
      serverMode,
      multiColumnSort,
      showPaginationInfo,
      highlightRowHover,
      highlightRowHoverColor,
      preservePageOnDataChange,
      totalFilteredResults,
      tableWrapperClasses,
      tableClasses,
      headerColSpan,
      pagination,
      visibleButtons,
      perPageOptions,
      globalSearch,
      totalCurrentPageRows,
      totalOriginalRows,
      totalFilteredRows,
      isResponsive,
      showPaginationRow,
      updatePerPageItems,
      updateCurrentPage,
      getProperty: get,
      getCellSlotName,
      canShowColumn,
      isSortableColumn,
      columnClasses,
      updateSortQuery,
      emitActionEvent,
    };
  },
  components: {
    TableRow,
    Pagination,
    TableColumnVue,
  },
});
</script>

<style scoped>
.empty-results {
  margin: 10rem auto;
}
</style>