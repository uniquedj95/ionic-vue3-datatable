<template>
  <div :class="tableWrapperClasses">
    <table class="table" :class="tableClasses">
      <thead>
        <tr v-if="showToolsRow" class="table-tools">
          <th :colspan="headerColSpan">
            <ion-grid>
              <ion-row>
                <ion-col size-md="4">
                  <ion-row>
                    <ion-col
                      size-md="6"
                      v-if="(globalSearch && globalSearch.visibility) || true"
                    >
                      <div
                        class="form-group has-clear-right"
                        :class="globalSearch.class"
                      >
                        <span
                          v-if="globalSearch.showClearButton"
                          class="form-control-feedback global-search-clear"
                          @click="clearGlobalSearch"
                        >
                          <ion-icon :icon="closeCircle"></ion-icon>
                        </span>
                        <input
                          v-if="globalSearch.searchOnPressEnter"
                          ref="globalSearch"
                          type="text"
                          class="form-control"
                          :placeholder="globalSearch.placeholder"
                          @keyup.enter="
                            updateGlobalSearchHandler($event.target?.value)
                          "
                        />
                        <input
                          v-else
                          ref="globalSearch"
                          type="text"
                          class="form-control"
                          :placeholder="globalSearch.placeholder"
                          @keyup.stop="updateGlobalSearch($event.target?.value)"
                        />
                      </div>
                    </ion-col>
                    <ion-col size-md="4">
                      <div
                        class="btn-group"
                        role="group"
                        aria-label="Table Actions buttons"
                      >
                        <button
                          v-if="showRefreshButton"
                          type="button"
                          class="btn btn-secondary refresh-button"
                          @click="$emit('refresh-data')"
                        >
                          <slot name="refresh-button-text"> Refresh </slot>
                        </button>
                        <button
                          type="button"
                          v-if="showResetButton"
                          class="btn btn-secondary reset-button"
                          @click="resetQuery"
                        >
                          <slot name="reset-button-text"> Reset Query </slot>
                        </button>
                      </div>
                    </ion-col>
                  </ion-row>
                </ion-col>
                <ion-col size-md="8">
                  <slot name="action-buttons">
                    <div
                      class="btn-group float-right"
                      role="group"
                      aria-label="Basic example"
                    >
                      <button
                        v-for="(action, key, index) in actions"
                        :key="index"
                        type="button"
                        class="btn"
                        :class="getActionButtonClass(action)"
                        @click="emitActionEvent(action)"
                      >
                        <slot :name="action.label">
                          <span v-html="action.label"></span>
                        </slot>
                      </button>
                    </div>
                  </slot>
                </ion-col>
              </ion-row>
            </ion-grid>
          </th>
        </tr>

        <tr>
          <select-all-rows-check-box
            v-if="checkboxRows"
            :allRowsSelected="allRowsSelected"
            :currentPageSelectionCount="currentPageSelectionCount"
            @selectAll="selectAllCheckbox"
          />

          <slot name="columns" :columns="cColumns">
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
          </slot>
        </tr>
      </thead>
      <tbody>
        <!-- filter row starts here -->
        <tr class="table-active" v-if="showFilterRow">
          <td v-show="checkboxRows"></td>
          <template v-for="(column, key, index) in cColumns">
            <td v-if="canShowColumn(column)" :key="index" align="center">
              <template v-if="hasFilter(column)">
                <SimpleFilter
                  v-if="column.filter?.type === 'simple'"
                  :column="column"
                  @updateFilter="updateFilter"
                  @clearFilter="clearFilter"
                >
                </SimpleFilter>
                <MultiSelect
                  v-if="column.filter?.type === 'select'"
                  :options="column.filter?.options"
                  :column="column"
                  @updateMultiSelectFilter="updateMultiSelectFilter"
                  @clearFilter="clearFilter"
                ></MultiSelect>
                <template v-if="column.filter?.type === 'custom'">
                  <slot :name="column.filter?.slotName" :column="column">
                  </slot>
                </template>
              </template>
            </td>
          </template>
        </tr>
        <!-- filter row ends here -->

        <!-- data rows stars here -->
        <table-row
          v-for="(row, index) in cRows"
          :key="index"
          :row="row"
          :columns="cColumns"
          :rowIndex="index"
          :checkboxRows="checkboxRows"
          :rowsSelectable="rowsSelectable"
          :selectedItems="selectedItems"
          :highlightRowHover="highlightRowHover"
          :highlightRowHoverColor="highlightRowHoverColor"
          :propPowClasses="classes.row"
          :propCellClasses="classes.cell"
          :uniqueId="uniqueId"
          @addRow="handleAddRow"
          @removeRow="handleRemoveRow"
        ></table-row>
        
        <tr v-show="cRows.length === 0">
          <td :colspan="headerColSpan">
            <div class="empty-results"> No results found </div>
          </td>
        </tr>
        
        <tr v-if="showPaginationRow" class="footer-pagination-row">
          <td :colspan="headerColSpan">
            <ion-row>
              <ion-col size-md="8">
                <pagination
                  v-if="pagination"
                  :currentPage="currentPage"
                  :perPageItems="perPageItems"
                  :perPageOptions="perPageOptions"
                  :total="totalFilteredRows"
                  :visibleButtons="visibleButtons"
                  @updatePerPageItems="updatePerPageItems"
                  @updateCurrentPage="''"
                />
              </ion-col>
              <ion-col size-md="4">
                <PaginationInfo
                  v-if="showPaginationInfo"
                  :totalRows="totalRows"
                  :totalFilteredRows="totalFilteredRows"
                  :totalOriginalRows="totalOriginalRows"
                  :showSelectedRowsInfo="showSelectedRowsInfo"
                  :totalSelectedItems="totalSelectedItems"
                />
              </ion-col>
            </ion-row>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import {
  isEqual,
  debounce,
  cloneDeep,
  differenceWith,
  differenceBy,
  intersectionWith,
  intersectionBy,
  orderBy,
  get,
  omit,
  clone,
  has,
  findIndex,
  isArray,
} from "lodash";
import TableRow from "./TableRow.vue";
import SelectAllRowsCheckBox from "./SelectAllRowsCheckBox.vue";
import Pagination from "./CustomPagination.vue";
import PaginationInfo from "./PaginationInfo.vue";
import SimpleFilter from "./filters/SimpleFilter.vue";
import MultiSelect from "./filters/MultiSelect.vue";
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
    console.log(props.columns);
    const cRows = ref(cloneDeep(props.rows));
    const currentPage = ref(props.config.currentPage || 1);
    const perPageItems = ref(props.config.perPageItems || 10);
    const updatePerPageItems = (value: number) => perPageItems.value = value
    const loaderText = ref(props.config.loaderText || "Loading...");
    const tempFilteredResults = ref<any[]>([]);
    const selectedItems = ref<any[]>([]);
    const allRowsSelected = ref(false);
    const totalRows = computed(() => props.rows.length);
    const totalFilteredRows = computed(() =>
      serverMode.value ? totalRows.value : tempFilteredResults.value.length
    );
    const totalSelectedItems = computed(() => selectedItems.value.length);
    const totalFilteredResults = computed(
      () => tempFilteredResults.value.length
    );
    const totalOriginalRows = computed(() =>
      serverMode.value ? totalFilteredRows.value : props.rows.length
    );
    const lastSelectedItemIndex = ref(0);
    const isFirstTime = ref(true);
    const isResponsive = ref(true);
    const canEmitQueries = ref(false);
    const serverMode = ref(get(props.config, "serverMode", false));
    const checkboxRows = ref(get(props.config, "checkboxRows", false));
    const rowsSelectable = ref(get(props.config, "rowsSelectable", false));
    const multiColumnSort = ref(get(props.config, "multiColumnSort", false));
    const showPaginationInfo = ref(get(props.config, "paginationInfo", true));
    const showSelectedRowsInfo = ref(
      get(props.config, "selectedRowsInfo", false)
    );
    const showRefreshButton = ref(get(props.config, "showRefreshButton", true));
    const showResetButton = ref(get(props.config, "showResetButton", true));
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
        console.log(column);
        return column;
      });
    });

    const highlightRowHoverColor = computed(() => {
      return highlightRowHover.value
        ? get(props.config, "highlightRowHoverColor", "#d6d6d6")
        : "";
    });

    const uniqueId = computed(() => {
      let uniqueId = "";
      if (!hasUniqueId.value) {
        uniqueId = "id";
        return uniqueId;
      }
      cColumns.value.some((column, key) => {
        if (get(column, "uniqueId")) {
          uniqueId = column.name;
          return true;
        }
      });
      return uniqueId;
    });

    const headerColSpan = computed(() => {
      let count = checkboxRows.value ? 1 : 0;
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

    const showToolsRow = computed(() => {
      return (
        globalSearch.value.visibility ||
        showRefreshButton ||
        showResetButton ||
        props.actions.length > 0
      );
    });

    const showFilterRow = computed(() => {
      let showRow = false;
      cColumns.value.some((column, key) => {
        if (has(column, "filter")) {
          showRow = true;
          return true;
        }
      });
      return showRow;
    });

    const showPaginationRow = computed(() => {
      return (
        (pagination.value ||
          showPaginationInfo.value ||
          showSelectedRowsInfo.value)
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

    const isSelectable = computed(
      () => checkboxRows.value || rowsSelectable.value
    );

    const updateGlobalSearch = computed(() =>
      debounce(updateGlobalSearchHandler, globalSearch.value.searchDebounceRate)
    );

    const hasUniqueId = computed(() => {
      cColumns.value.some((column) => {
        if (get(column, "uniqueId")) {
          return true;
        }
      });
      return false;
    });

    const currentPageSelectionCount = computed(() => {
      let result = [];
      if (serverMode.value && !hasUniqueId.value) {
        result = intersectionWith(cRows.value, selectedItems.value, isEqual);
      } else {
        result = intersectionBy(
          cRows.value,
          selectedItems.value,
          uniqueId.value
        );
      }
      return result.length;
    });

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

    const updateFilter = (payload: any) => {
      let value =
        typeof payload.value === "number"
          ? payload.value.toString()
          : payload.value;

      let column: TableColumn = payload.column;
      let filterIndex = findIndex(query.value.filters, {
        name: column.name,
      });
      if (filterIndex === -1 && value !== "") {
        query.value.filters.push({
          type: column.filter?.type,
          name: column.name,
          text: value.trim(),
          config: column.filter,
        });
      } else if (value === "") {
        query.value.filters.splice(filterIndex, 1);
      } else {
        query.value.filters[filterIndex].text = value.trim();
      }
    };

    const isMultiFilterMode = (filter: TableColumnFilter) => {
      return filter.mode === "multi" && isArray(filter.init?.value);
    };

    const isSingleFilterMode = (filter: TableColumnFilter) => {
      return (
        filter.mode === "single" &&
        Number.isInteger(filter.init?.value) &&
        filter.init?.value > -1
      );
    };

    const updateMultiSelectFilter = (payload: any) => {
      let selectedOptions = payload.selectedOptions;
      let column: TableColumn = payload.column;

      let filterIndex = findIndex(query.value.filters, {
        name: column.name,
      });

      if (filterIndex === -1) {
        if (selectedOptions.length === 0) {
          return;
        }
        query.value.filters.push({
          type: column.filter?.type,
          mode: column.filter?.mode,
          name: column.name,
          selectedOptions: selectedOptions,
          config: column.filter,
        });
      } else {
        if (selectedOptions.length === 0) {
          query.value.filters.splice(filterIndex, 1);
        } else {
          query.value.filters[filterIndex].selectedOptions = selectedOptions;
        }
      }
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

    const selectAllCheckbox = () => {
      if (allRowsSelected.value || currentPageSelectionCount.value > 0) {
        unSelectAllItems();
        allRowsSelected.value = false;
      } else {
        selectAllItems();
        allRowsSelected.value = true;
      }
    };

    const initGlobalSearch = () => {
      // this.$refs.globalSearch.value = globalSearch.value.init?.value;
      query.value.globalSearch = globalSearch.value.init?.value;
    };

    const hasFilter = (column: TableColumn) => {
      return has(column, "filter.type");
    };

    const clearFilter = (column: TableColumn) => {
      let filterIndex = getFilterIndex(column);
      if (filterIndex !== -1) {
        query.value.filters.splice(filterIndex, 1);
      }
    };

    const getFilterIndex = (column: TableColumn) => {
      return findIndex(query.value.filters, {
        name: column.name,
      });
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

    const isShiftSelection = (shiftKey: boolean, rowIndex: number) => {
      return (
        shiftKey === true &&
        lastSelectedItemIndex.value !== null &&
        lastSelectedItemIndex.value !== rowIndex
      );
    };

    const handleAddRow = (payload: any) => {
      let row = cRows.value[payload.rowIndex];
      if (isShiftSelection(payload.shiftKey, payload.rowIndex)) {
        let rows = getShiftSelectionRows(payload.rowIndex);
        rows.forEach((_row: any) => {
          addSelectedItem(_row);
        });
      } else {
        addSelectedItem(row);
      }

      emit("selectRow", {
        selectedItems: cloneDeep(selectedItems.value),
        selectedItem: row,
      });

      let difference = [];

      if (serverMode.value && !hasUniqueId.value) {
        difference = differenceWith(cRows.value, selectedItems.value, isEqual);
      } else {
        difference = differenceBy(
          cRows.value,
          selectedItems.value,
          uniqueId.value
        );
      }

      allRowsSelected.value = difference.length === 0;
      lastSelectedItemIndex.value = payload.rowIndex;
    };

    const getActionButtonClass = (action: any): string => {
      return get(action, "class", " btn-secondary");
    };

    const handleRemoveRow = (payload: any) => {
      let row = cRows.value[payload.rowIndex];
      if (isShiftSelection(payload.shiftKey, payload.rowIndex)) {
        let rows = getShiftSelectionRows(payload.rowIndex);
        rows.forEach((_row: any) => {
          removeSelectedItem(_row);
        });
      } else {
        removeSelectedItem(row);
      }
      emit("unselectRow", {
        selectedItems: cloneDeep(selectedItems.value),
        unselectedItem: row,
      });
      // EventBus.$emit('unselect-select-all-items-checkbox');
      allRowsSelected.value = false;
      lastSelectedItemIndex.value = payload.rowIndex;
    };

    const addSelectedItem = (item: any) => {
      let index = -1;
      if (serverMode.value && !hasUniqueId.value) {
        index = findIndex(selectedItems.value, (selectedItem) => {
          return isEqual(selectedItem, item);
        });
      } else {
        index = findIndex(selectedItems.value, (selectedItem) => {
          return selectedItem[uniqueId.value] == item[uniqueId.value];
        });
      }

      if (index == -1) {
        selectedItems.value.push(item);
      }
    };

    const selectAllItems = () => {
      const difference =
        serverMode.value && !hasUniqueId.value
          ? differenceWith(cRows.value, selectedItems.value, isEqual)
          : differenceBy(cRows.value, selectedItems.value, uniqueId.value);

      selectedItems.value.push(...difference);

      emit("selectAllRows", {
        selectedItems: cloneDeep(selectedItems.value),
      });
    };

    const unSelectAllItems = () => {
      let difference = [];

      if (serverMode.value && !hasUniqueId.value) {
        const result = intersectionWith(
          cRows.value,
          selectedItems.value,
          isEqual
        );
        difference = differenceWith(selectedItems.value, result, isEqual);
      } else {
        const result = intersectionBy(
          cRows.value,
          selectedItems.value,
          uniqueId.value
        );
        difference = differenceBy(selectedItems.value, result, uniqueId.value);
      }

      selectedItems.value = difference;

      emit("unselectAllRows", {
        selectedItems: cloneDeep(selectedItems.value),
      });
    };

    const removeSelectedItem = (item: any) => {
      selectedItems.value.some((selectedItem, index) => {
        if (isEqual(item, selectedItem)) {
          selectedItems.value.splice(index, 1);
          return true;
        }
      });
    };

    const getShiftSelectionRows = (rowIndex: number) => {
      let start = 0;
      let end = 0;
      if (lastSelectedItemIndex.value < rowIndex) {
        start = lastSelectedItemIndex.value;
        end = rowIndex + 1;
      } else if (lastSelectedItemIndex.value > rowIndex) {
        start = rowIndex;
        end = lastSelectedItemIndex.value + 1;
      }
      return cRows.value.slice(start, end);
    };

    const resetSort = () => {
      query.value.sort = [];
      filter(!preservePageOnDataChange.value);
    };

    const updateGlobalSearchHandler = (value: any) => {
      query.value.globalSearch = value;
    };

    const clearGlobalSearch = () => {
      query.value.globalSearch = "";
      // this.$refs.globalSearch.value = "";
    };

    const resetQuery = () => {
      query.value = {
        sort: [],
        filters: [],
        globalSearch: "",
      };

      // globalSearch.value.visibility && (this.$refs.globalSearch.value = "");

      emit("resetQuery");
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

    const initFilterQueries = () => {
      cColumns.value &&
        cColumns.value.forEach((column) => {
          if (!column.filter || !column.filter.init?.value) return;

          if (column.filter.type == "simple") {
            updateFilter({
              value: column.filter.init.value,
              column: column,
            });
          } else if (column.filter.type == "select") {
            let initialValues: any[] = [];
            if (isMultiFilterMode(column.filter)) {
              initialValues = column.filter.init.value;
            } else if (isSingleFilterMode(column.filter)) {
              initialValues = [column.filter.init.value];
            }

            let selectedOptions =
              column.filter?.options &&
              column.filter?.options
                .filter((_, index) => initialValues.includes(index))
                .map((option) => option.value);

            updateMultiSelectFilter({
              selectedOptions: selectedOptions,
              column: column,
            });
          }
        });
    };

    const searchGlobally = (rows: any[]) => {
      let globalSearchResults = rows.filter((row) => {
        let flag = false;

        cColumns.value.some((column, key) => {
          let value: string = get(row, column.name, "");
          let globalSearchText = query.value.globalSearch;

          if (!globalSearch.value.caseSensitive) {
            value = value.toLowerCase();
            globalSearchText = globalSearchText.toLowerCase();
          }

          if (value.indexOf(globalSearchText) > -1) {
            flag = true;
            return;
          }
        });

        return flag;
      });

      return globalSearchResults;
    };

    const simpleFilter = (
      value: string,
      filterText: string,
      config: GlobalSearchConfig
    ) => {
      if (!get(config, "caseSensitive", false)) {
        value = value.toLowerCase();
        filterText = filterText.toLowerCase();
      }
      return value.indexOf(filterText) > -1;
    };

    const multiSelectFilter = (value: string, selectedOptions: any[]) => {
      value = value.toLowerCase();

      selectedOptions = selectedOptions.map((option) => {
        return typeof option !== "string"
          ? option.toString().toLowerCase()
          : option.toLowerCase();
      });
      return selectedOptions.includes(value);
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

      if (isSelectable.value) {
        payload.selectedItems = cloneDeep(selectedItems.value);
      }

      emit(action.eventName, payload);
    };

    const filter = (resetPage = true, isInit = false) => {
      let res = originalRows.value.filter((row) => {
        let flag = true;
        query.value.filters.some((filter, key) => {
          if (filter.type === "simple") {
            if (
              simpleFilter(get(row, filter.name), filter.text, filter.config)
            ) {
              // continue to next filter
              flag = true;
            } else {
              // stop here and break loop since one filter has failed
              flag = false;
              return true;
            }
          } else if (filter.type === "select") {
            if (
              multiSelectFilter(get(row, filter.name), filter.selected_options)
            ) {
              flag = true;
            } else {
              flag = false;
              return true;
            }
          } else if (filter.type === "custom") {
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
      if (query.value.globalSearch !== "" && !!totalFilteredRows.value) {
        tempFilteredResults.value = searchGlobally(tempFilteredResults.value);
      }

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
        let doPaginateFilter = currentPage.value === 1;
        if (!preservePageOnDataChange.value) currentPage.value = 1;
        if (doPaginateFilter) {
          paginateFilter();
        }
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

    watch(
      () => props.columns,
      () => initFilterQueries(),
      {
        deep: true,
      }
    );

    watch(
      cRows,
      (newVal) => {
        lastSelectedItemIndex.value = -1;

        if (selectedItems.value.length === 0) {
          allRowsSelected.value = false;
          return;
        }

        let difference =
          serverMode.value && !hasUniqueId.value
            ? differenceWith(newVal, selectedItems.value, isEqual)
            : differenceBy(newVal, selectedItems.value, uniqueId.value);

        allRowsSelected.value = difference.length === 0;
      },
      { deep: true }
    );

    watch(currentPage, (newVal, oldVal) => {
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
      initFilterQueries();
      if (globalSearch.value.visibility) {
        nextTick(() => {
          initGlobalSearch();
        });
      }

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
      uniqueId,
      currentPage,
      perPageItems,
      selectedItems,
      allRowsSelected,
      serverMode,
      loaderText,
      checkboxRows,
      rowsSelectable,
      multiColumnSort,
      showPaginationInfo,
      highlightRowHover,
      highlightRowHoverColor,
      showSelectedRowsInfo,
      showRefreshButton,
      showResetButton,
      preservePageOnDataChange,
      totalFilteredResults,
      tableWrapperClasses,
      tableClasses,
      showToolsRow,
      headerColSpan,
      pagination,
      visibleButtons,
      perPageOptions,
      globalSearch,
      totalSelectedItems,
      totalOriginalRows,
      totalFilteredRows,
      currentPageSelectionCount,
      isResponsive,
      isSelectable,
      showPaginationRow,
      showFilterRow,
      updateGlobalSearch,
      updatePerPageItems,
      getProperty: get,
      getCellSlotName,
      handleRemoveRow,
      handleAddRow,
      clearFilter,
      updateMultiSelectFilter,
      updateGlobalSearchHandler,
      updateFilter,
      hasFilter,
      canShowColumn,
      isSortableColumn,
      columnClasses,
      updateSortQuery,
      selectAllCheckbox,
      emitActionEvent,
      getActionButtonClass,
      resetQuery,
      clearGlobalSearch,
    };
  },
  components: {
    TableRow,
    SelectAllRowsCheckBox,
    SimpleFilter,
    MultiSelect,
    Pagination,
    PaginationInfo,
    TableColumnVue
},
});
</script>