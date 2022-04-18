import { TableColumn } from "@/interfaces/datatable";
import { get } from "lodash";

export function canShowColumn(column: TableColumn){
  return get(column, "visibility", true);
}

export function isSortableColumn(column: TableColumn){
  return !!get(column, "sort");
}

export function isColumnSorted(columnName: string, sortQuery = null as any){
  return (
    sortQuery &&
    sortQuery.name &&
    sortQuery.name === columnName
  );
}

export function getRowValue(row: Record<string, any>, path: string) {
  return get(row, path, '')
}