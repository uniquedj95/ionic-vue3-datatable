<template>
  <th
    v-on="
      isSortableColumn(column)
        ? { click: () => $emit('updateSort', column) }
        : {}
    "
    :class="{ 'sort-cursor': isSortableColumn }"
  >
    {{ column.label.toUpperCase() }}

    <SortIcon
      v-if="isSortableColumn(column)"
      :sort="query.sort"
      :column="column"
    ></SortIcon>
  </th>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
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
  setup() {
    return {
      isSortableColumn,
    };
  },
});
</script>
<style scoped>
.sort-cursor {
  cursor: pointer;
}
</style>
