import {
  computed,
  defineComponent,
  h,
  PropType,
  ref,
} from "vue";
import { isArray, isEmpty } from "lodash";
import { ITableColumn } from "@/interfaces/datatable";
import { canShowColumn, getCellCSSClassess, getRowValue } from "@/utils/Table";

export default defineComponent({
  props: {
    row: {
      type: Object as PropType<any>,
      required: true,
    },
    globalRowCSSClasses: {
      type: Object as PropType<string[] | string>,
      required: false,
    },
    globalCellCSSClasses: {
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
      return isArray(props.globalRowCSSClasses) && !isEmpty(props.globalRowCSSClasses)
          ? props.globalRowCSSClasses.toString().replace(",", " ")
          : props.globalRowCSSClasses;
    });  

    return () => h(
      'tr', 
      { 
        'data-id': props.row.rowId, 
        style: rowHighlightedStyles.value, 
        class: rowClasses.value, 
        onmouseenter(){
          rowHighlighted.value = true
        },
        onmouseleave(){
          rowHighlighted.value = false
        }
      },
      props.columns.map((column, index) => canShowColumn(column) && h(
        'td', {
          key: index,
          class: getCellCSSClassess(column, props.globalCellCSSClasses)
        },
        getRowValue(props.row, column.name)
      ))
    )
  },
});
