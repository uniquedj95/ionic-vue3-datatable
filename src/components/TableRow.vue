<template>
  <tr
    :data-id="row.rowId"
    :style="rowHighlightedStyles"
    :class="rowClasses"
    @mouseenter="rowHighlighted = true"
    @mouseleave="rowHighlighted = false"
  >
    <template v-for="(column, index) in columns">
      <td v-if="canShowColumn(column)" :key="index" :class="cellClasses(column)" >
        {{ getRowValue(row, column.name) }}
      </td>
    </template>
  </tr>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
} from "vue";
import { isArray, isEmpty } from "lodash";
import { ITableColumn } from "@/interfaces/datatable";
import { canShowColumn, getRowValue } from "@/utils/Table";

export default defineComponent({
  props: {
    row: {
      type: Object as PropType<any>,
      required: true,
    },
    propRowClasses: {
      type: Object as PropType<string[] | string>,
      required: false,
    },
    propCellClasses: {
      type: Object as PropType<string[] | string>,
      required: false,
    },
    columns: {
      type: Object as PropType<ITableColumn[]>,
      default: () => [] as Array<ITableColumn>,
    },
    highlightRowHover: {
      type: Boolean,
      default: false,
    },
    highlightRowHoverColor: {
      type: String,
      default: "#d6d6d6",
    },
    rowIndex: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const rowHighlighted = ref(false);
    const rowHighlightedStyles = computed(() => rowHighlighted.value 
      ? { background: props.highlightRowHoverColor, cursor: 'pointer' }
      : {}
    );
      
    const rowClasses = computed(() => {
      return isArray(props.propRowClasses) && !isEmpty(props.propRowClasses)
          ? props.propRowClasses.toString().replace(",", " ")
          : props.propRowClasses;
    });

    const cellClasses = (column: ITableColumn) => {
      if (typeof props.propCellClasses === "string") {
        return props.propCellClasses;
      }

      let classes = "";
      let defaultAextAlignment = "text-center";
      let alignments = [
        "text-justify",
        "text-right",
        "text-left",
        "text-center",
      ];
      classes +=
        column.rowTextAlignment && alignments.includes(column.rowTextAlignment)
          ? " " + column.rowTextAlignment
          : " " + defaultAextAlignment;

      if (column.rowClasses) classes += " " + column.rowClasses;
      if (isArray(props.propCellClasses) && !isEmpty(props.propCellClasses))
        classes += props.propCellClasses.toString().replace(",", " ");

      return classes;
    };

    return {
      rowHighlightedStyles,
      rowHighlighted,
      rowClasses,
      cellClasses,
      canShowColumn,
      getRowValue,
    };
  },
});
</script>
