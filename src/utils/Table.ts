import { ITableColumn } from "@/interfaces/datatable";
import { get } from "lodash";

export function canShowColumn(column: ITableColumn){
  return get(column, "visibility", true);
}

export function isSortableColumn(column: ITableColumn){
  return !!get(column, "sortable", false);
}

export function getRowValue(row: Record<string, any>, path: string) {
  return get(row, path, '')
}

export function getCellSlotName (column: ITableColumn) {
  return get(column, "slotName") || column.name.replace(/\./g, "_");
}