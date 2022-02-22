<template>
  <div class="float-right">
    <ion-icon :icon="sortIcon"></ion-icon>
    <template v-if="order == 'asc'">
      <slot name="sort-asc-icon"> </slot>
    </template>

    <template v-else-if="order === 'desc'">
      <slot name="sort-desc-icon"> </slot>
    </template>

    <template v-else>
      <slot name="no-sort-icon"> </slot>
    </template>
  </div>
</template>

<script lang="ts">
import { TableColumn } from "@/interfaces/datatable";
import { computed, defineComponent, PropType } from "vue";
import { swapVertical } from "ionicons/icons";

export default defineComponent({
  props: {
    sort: {
      type: Object as PropType<any[]>,
      default: () => [] as Array<any>,
    },
    column: {
      type: Object as PropType<TableColumn>,
      default: () => ({}),
    },
  },
  setup(props) {
    const order = computed(() => {
      const index = props.sort.findIndex((s) => {
        s === props.column.initialSortOrder;
      });

      if (index === -1) {
        return null;
      } else {
        return props.sort[index].order;
      }
    })
    return {
      sortIcon: swapVertical,
      order
    };
  },
});
</script>

<style>
.float-right {
  float: right;
}
</style>