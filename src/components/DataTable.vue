<template>
  <div :class="tableWrapperClasses" style="margin: .4rem">
    <table class="table" :class="tableClasses">
      <thead>
        <tr>
          <template v-for="(column, index) in cColumns">
            <table-column
              v-if="canShowColumn(column)"
              :key="index"
              :column="column"
              :query="filterQuery"
              class="column-header"
              :class="columnClasses(column)"
              @updateSort="updateSortQuery(column)"
            />
          </template>
        </tr>
      </thead>
      <tbody>
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
        />

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
import TableRow from "./TableRow";
import Pagination from "./CustomPagination.vue";
import {
  computed,
  defineComponent,
  nextTick,
  onMounted,
  PropType,
  reactive,
  ref,
  watch,
} from "vue";
import {
  IGlobalSearchConfig,
  ITableActionsBtn,
  ITableColumn,
  ITableColumnFilter,
  ITableConfig,
  ITableCSSClasses,
  ITableFilterQuery,
} from "@/interfaces/datatable";
import { closeCircle } from "ionicons/icons";
import { canShowColumn, isSortableColumn } from "@/utils/Table";
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

    const globalSearch = reactive<IGlobalSearchConfig>(props.config?.globalSearch || {
      placeholder: "Search here",
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
          let result = findIndex(filterQuery.sort, { name: column.name });
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
        let start = (currentPage.value - 1) * perPageItems.value;
        let end = start + perPageItems.value;
        cRows.value = tempFilteredResults.value.slice(start, end);
      } else {
        cRows.value = cloneDeep(tempFilteredResults.value);
      }
    };

    const updateSortQuery = (column: ITableColumn) => {
      let result = findIndex(filterQuery.sort, {
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
        let orders = filterQuery.sort.map((sortConfig) => sortConfig.order);
        tempFilteredResults.value = orderBy(
          tempFilteredResults.value,
          filterQuery.sort.map((sortConfig) => {
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

    const emitQueryParams = (page = null as null | number) => {
      if (serverMode.value && canEmitQueries.value) {
        let queryParams = cloneDeep(filterQuery);
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

    const columnClasses = (column: ITableColumn) => {
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

    const filter = (resetPage = true, isInit = false) => {
      let res = originalRows.value.filter((row) => {
        let flag = true;
        filterQuery.filters.some((filter) => {
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
      [filterQuery.filters, filterQuery.globalSearch],
      () => {
        if (!serverMode.value) {
          filter(!preservePageOnDataChange.value);
        }
      },
      { deep: true }
    );

    watch(filterQuery, () =>  serverMode.value ? emitQueryParams() : sort(), { 
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
              let index = filterQuery.filters.findIndex(
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

    return {
      closeCircle,
      cRows,
      cColumns,
      filterQuery,
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
      canShowColumn,
      isSortableColumn,
      columnClasses,
      updateSortQuery,
    };
  },
});
</script>

<style scoped>
.empty-results {
  margin: 10rem auto;
}
</style>