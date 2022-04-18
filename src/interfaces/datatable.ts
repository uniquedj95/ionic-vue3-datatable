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
  sort?: boolean;
  initialSort?: boolean;
  initialSortOrder?: "asc" | "desc" | "none";
  sortCaseSensitive?: boolean;
  slotName?: string;
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
