<template>
  <div class="right">
    <template v-if="isColumnSorted(column.name, sort)">
      <ion-icon :icon="swapVertical"></ion-icon>
    </template>
    <template v-else>
      <ion-icon v-if="order === 'asc'" :icon="arrowUp"></ion-icon>
      <ion-icon v-else-if="order === 'desc'" :icon="arrowDown"></ion-icon>
      <ion-icon v-else :icon="swapVertical"></ion-icon>
    </template>
  </div>
</template>

<script lang="ts">
import { TableColumn } from "@/interfaces/datatable";
import { computed, defineComponent, PropType } from "vue";
import { swapVertical, arrowUp, arrowDown } from "ionicons/icons";
import { IonIcon } from "@ionic/vue";
import { isColumnSorted } from "@/utils/Table";

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
  components: {
    IonIcon,
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
    });
    return {
      order,
      swapVertical,
      arrowUp,
      arrowDown,
      isColumnSorted,
    };
  },
});
</script>

<style>
.right {
  float: right;
  margin-right: .5em;
}
</style>