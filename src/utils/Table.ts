import { ITableColumn } from "@/interfaces/datatable";
import { get, isArray } from "lodash";

export const textAlignments = [
  "text-justify",
  "text-right",
  "text-left",
  "text-center",
]

export function canShowColumn(column: ITableColumn) {
  return get(column, "visibility", true);
}

export function isSortableColumn(column: ITableColumn) {
  return !!get(column, "sortable", false);
}

export function getRowValue(row: Record<string, any>, path: string) {
  return get(row, path, '')
}

export function getCellSlotName(column: ITableColumn) {
  return get(column, "slotName") || column.name.replace(/\./g, "_");
}

export function getCellCSSClassess(column: ITableColumn, globalCellClassess = '' as  string | string[]) {
  const defaultTextAlignment = "text-center";
  let classes = isArray(globalCellClassess) 
    ? " " + globalCellClassess.toString().replace(',', " ")
    : " " + globalCellClassess
  
  classes += column.rowTextAlignment && textAlignments.includes(column.rowTextAlignment)
    ? " " + column.rowTextAlignment
    : " " + defaultTextAlignment;

  return classes;
}
