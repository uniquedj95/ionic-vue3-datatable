import { TableColumn } from "@/interfaces/datatable";
import { get } from "lodash";

export function canShowColumn(column: TableColumn){
  return get(column, "visibility", true);
}

export function isSortableColumn(column: TableColumn){
  return !!get(column, "sort");
}