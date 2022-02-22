<template>
  <tr
    :data-id="rowId"
    ref="row"
    v-bind:style="{ background: rowHighlighted ? highlightRowHoverColor : '' }"
    :class="rowClasses"
    v-on="rowsSelectable ? { click: (event) => handleRowSelect(event) } : {}"
  >
    <CheckBox
      v-if="checkboxRows"
      :rowsSelectable="rowsSelectable"
      :rowSelected="rowSelected"
      @addRow="addRow"
      @removeRow="removeRow"
    />
    <template v-for="(column, index) in columns">
      <td
        v-if="canShowColumn(column)"
        :key="index"
        :class="cellClasses(column)"
      >
        <slot :name="'' + getCellSlotName(column)"> </slot>
      </td>
    </template>
  </tr>
</template>

<script lang="ts">
import CheckBox from "./CheckBox.vue";
import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  watch,
  ref,
} from "vue";
import { differenceWith, isEqual, get, isArray, isEmpty } from "lodash";
import { TableColumn } from "@/interfaces/datatable";
import useEmitter from "@/composables/useEmitter";

export default defineComponent({
  components: {
    CheckBox,
  },
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
      type: Object as PropType<TableColumn[]>,
      default: () => [] as Array<TableColumn>,
    },
    uniqueId: {
      type: [Number, String],
      required: true,
    },
    selectedItems: {
      type: Object as PropType<any[]>,
      default: () => [] as Array<any>,
    },
    checkboxRows: {
      type: Boolean,
      default: false,
    },
    highlightRowHover: {
      type: Boolean,
      default: false,
    },
    highlightRowHoverColor: {
      type: String,
      default: "#d6d6d6",
    },
    rowsSelectable: {
      type: Boolean,
      default: false,
    },
    rowIndex: {
      type: Number,
      required: true,
    },
  },
  emits: ["addRow", "removeRow"],
  setup(props, { emit }) {
    const emmitter = useEmitter();
    const rowSelected = ref(false);
    const rowHighlighted = ref(false);
    const canShowColumn = (column: TableColumn) => !!column.visibility;
    const rowHover = (state: boolean) => (rowHighlighted.value = state);
    const rowId = computed(() => get(props.row, props.uniqueId));
    const rowClasses = computed(() => {
      let classes =
        isArray(props.propRowClasses) && !isEmpty(props.propRowClasses)
          ? props.propRowClasses.toString().replace(",", " ")
          : props.propRowClasses;

      if (rowSelected.value) classes += " row-selected";
      return classes;
    });

    const addRow = (shiftKey: any) =>
      emit("addRow", {
        shiftKey: shiftKey,
        rowIndex: props.rowIndex,
      });

    const removeRow = (shiftKey: any) =>
      emit("removeRow", {
        shiftKey: shiftKey,
        rowIndex: props.rowIndex,
      });

    const handleRowSelect = (event: any) => {
      if (rowSelected.value) {
        removeRow(event.shiftKey);
      } else {
        addRow(event.shiftKey);
      }
      rowSelected.value = !rowSelected.value;
    };

    const checkInSelecteditems = (selectedItems: Array<any>, row: any) => {
      if (!props.checkboxRows && !props.rowsSelectable) return;
      let difference = differenceWith(selectedItems, [row], isEqual);
      rowSelected.value = difference.length !== selectedItems.length;
    };

    const cellClasses = (column: TableColumn) => {
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

    const getCellSlotName = (column: TableColumn) => {
      if (column.slotName) return column.slotName;
      return column.name.replace(/\./g, "_");
    };

    watch(
      props.row,
      (newVal) => checkInSelecteditems(props.selectedItems, newVal),
      { deep: true }
    );
    watch(
      props.selectedItems,
      (newArr) => checkInSelecteditems(newArr, props.row),
      { deep: true }
    );

    onMounted(() => {
      if (props.highlightRowHover) {
        emmitter.on("mouseover", () => (rowHighlighted.value = true));
        emmitter.on("mouseleave", () => (rowHighlighted.value = false));
      }
      checkInSelecteditems(props.selectedItems, props.row);
    });

    return {
      rowSelected,
      rowHighlighted,
      rowId,
      rowClasses,
      cellClasses,
      canShowColumn,
      rowHover,
      addRow,
      removeRow,
      handleRowSelect,
      checkInSelecteditems,
      getCellSlotName,
    };
  },
});
</script>
