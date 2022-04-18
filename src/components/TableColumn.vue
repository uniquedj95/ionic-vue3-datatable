<template>
  <th 
    v-on="isSortable ? { click: () => $emit('updateSort', column) } : {}"
    :class="{ 'sort-cursor': isSortableColumn }"
  >
    {{ columnName }}
    <SortIcon
      v-if="isSortable"
      :sort="query.sort"
      :column="column"
    ></SortIcon>
  </th>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { isSortableColumn } from "@/utils/Table";
import SortIcon from "@/components/SortIcon.vue"
import { ITableColumn } from "@/interfaces/datatable";

export default defineComponent({
  props: {
    column: {
      type: Object as PropType<ITableColumn>,
      required: true,
    },
    query: {
      type: Object as PropType<any>,
      default: () => ({}),
    },
  },
  emits: ["updateSort"],
  components: { SortIcon },
  setup(props) {
    const isSortable = computed(() => isSortableColumn(props.column));
    const columnName = computed(() => props.column.label.toUpperCase());
    return {
      isSortable,
      columnName,
    };
  },
});
</script>
<style scoped>
.sort-cursor {
  cursor: pointer;
}
</style>
