<template>
  <th
    v-on="isSortableColumn ? { click: () => sort() } : {}"
    class="text-center"
    :class="{ 'sort-cursor': isSortableColumn }"
  >
    <slot name="column" :column="column">{{ column.label }}</slot>

    <template v-if="isSortableColumn">
      <template v-if="!isSort">
        <div class="float-right">
          <slot name="no-sort-icon"> &#x1F825;&#x1F827; </slot>
        </div>
      </template>

      <template v-else>
        <template v-if="query.sort.order === 'asc'">
          <div class="float-right">
            <slot name="sort-asc-icon"> &#x1F825; </slot>
          </div>
        </template>

        <template v-else-if="query.sort.order === 'desc'">
          <slot name="sort-desc-icon">
            <div class="float-right">&#x1F827;</div>
          </slot>
        </template>

        <template v-else>
          <div class="float-right">
            <slot name="no-sort-icon"> &#x1F825;&#x1F827; </slot>
          </div>
        </template>
      </template>
    </template>
  </th>
</template>

<script lang="ts">
import { get } from "lodash";
import { computed, defineComponent, PropType } from "vue";

export default defineComponent({
  props: {
    column: {
      type: Object as PropType<any>,
      default: () => ({}),
    },
    query: {
      type: Object as PropType<any>,
      default: () => ({}),
    },
  },
  emits: ["updateSort"],
  setup(props, { emit }) {
    const sort = () => emit("updateSort", props.column);

    const isSort = computed(
      () =>
        props.query.sort &&
        props.query.sort.name &&
        props.query.sort.name === props.column.name
    );

    const isSortableColumn = computed(() => get(props.column, "sort", false));

    return {
      sort,
      isSort,
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
