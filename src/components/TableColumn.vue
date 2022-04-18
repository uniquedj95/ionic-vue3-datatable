<template>
  <th 
    v-on="isSortable ? { click: () => $emit('updateSort', column) } : {}"
    :class="{ 'sort-cursor': isSortableColumn }"
  >
    {{ columnName }}
    <div class="ion-float-right" v-if="isSortable" style="margin-right: .4em">
      <ion-icon :icon="sortIcon"></ion-icon>
    </div>
  </th>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
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
    query: {
      type: Object as PropType<ITableFilterQuery>,
      default: () => ({}),
    },
  },
  emits: ["updateSort"],
  components: { IonIcon },
  setup(props) {
    const isSortable = computed(() => isSortableColumn(props.column));
    const columnName = computed(() => props.column.label.toUpperCase());
    const sortIcon = computed(() => {
    const query = props.query.sort.find(q => q.name === props.column.name)
      return !query 
        ? swapVertical
        : query.order.toLowerCase() === 'asc'
        ? arrowUp
        : arrowDown
    })
    return {
      isSortable,
      columnName,
      sortIcon,
    };
  },
});
</script>
<style scoped>
.sort-cursor {
  cursor: pointer;
}
</style>
