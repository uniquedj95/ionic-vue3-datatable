import { computed, defineComponent, h, PropType } from "vue";
import { isSortableColumn } from "@/utils/Table";
import { swapVertical, arrowUp, arrowDown } from "ionicons/icons";
import { IonIcon } from "@ionic/vue";
import { ITableColumn, ITableFilterQuery } from "@/interfaces/datatable";

export default defineComponent({
  props: {
    column: {
      type: Object as PropType<ITableColumn>,
      required: true,
    },
    filterQuery: {
      type: Object as PropType<ITableFilterQuery>,
      default: () => ({}),
    },
  },
  emits: ["updateSort"],
  components: { IonIcon },
  setup(props, { emit }) {
    const isSortable = computed(() => isSortableColumn(props.column));
    const sortIcon = computed(() => {
      const query = props.filterQuery.sort.find(q => q.name === props.column.name)
      return !query 
        ? swapVertical
        : query.order.toLowerCase() === 'asc'
        ? arrowUp
        : arrowDown
    })

    return () => h(
      'th', { 
        onClick() {
          if(isSortable.value) emit('updateSort', props.column)
        },
        style: { cursor: isSortable.value ? "pointer" : "default" }
      }, 
      [
        h('span', props.column.label),
        isSortable.value && h(IonIcon, { 
          icon: sortIcon.value, 
          style: { 
            marginRight: "5px", 
            float: "right",
            cursor: 'pointer'
          } 
        })
      ]
    );
  },
});
