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
  let classes = isArray(globalCellClassess) 
    ? " " + globalCellClassess.toString().replace(',', " ")
    : " " + globalCellClassess
  
  classes += column.rowTextAlignment && textAlignments.includes(column.rowTextAlignment)
    ? " " + column.rowTextAlignment
    : " text-center";

  return classes;
}

export function getColumnCSSClasses(column: ITableColumn) {
  let classes = "column-header";
  classes += column.columnTextAlignment && textAlignments.includes(column.columnTextAlignment)
    ? column.columnTextAlignment
    : " text-center";

  if ("columnClasses" in column) {
    classes += " " + column.columnClasses;
  }
  if (isSortableColumn(column)) {
    classes = classes + " sort-cursor";
  }

  return classes;
}
