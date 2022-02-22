export interface SelectAllCheckbox {
  visibility: boolean;
  text: string;
}

export interface TableColumnFilter {
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
  selectAllCheckbox?: SelectAllCheckbox;
  validator?: (rowValue: any, filterText: string) => boolean;
  init?: {
    value: any;
  };
}

export interface TableFilterQuery {
  sort: Array<any>;
  filters: Array<any>;
  globalSearch: string;
}

export interface TableColumn {
  label: string;
  name: string;
  id?: string | number;
  visibility?: boolean;
  filter?: TableColumnFilter;
  sort?: boolean;
  initialSort?: boolean;
  initialSortOrder?: "asc" | "desc" | false;
  sortCaseSensitive?: boolean;
  slotName?: string;
  columnClasses?: string | Array<string>;
  rowClasses?: string | Array<string>;
  rowTextAlignment?: string;
  columnTextAlignment?: string;
  uniqueId?: boolean;
}

export interface GlobalSearchConfig {
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

export interface TableConfig {
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
  cardTitle?: string;
  globalSearch?: GlobalSearchConfig;
  perPageOptions?: Array<number>;
  showResetButton?: boolean;
  showRefreshButton?: boolean;
  serverMode?: boolean;
  cardMode?: boolean;
  selectedRowsInfo?: boolean;
  preservePageOnDataChange?: true;
  loaderText?: string;
}

export interface TableCSSClasses {
  tableWrapper?: string;
  table?: string | Array<string>;
  row?: string | Array<string>;
  cell?: string | Array<string>;
}

export interface TableActionsBtn {
  icon: string;
  label: string;
  class: string;
  eventName: string;
  eventPayload?: Record<string, any>;
}

export interface TableCustomFilter {
  name: string;
  text: any;
  type: string;
}
