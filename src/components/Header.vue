<template>
  <thead>
    <tr>
      <th
        v-show="checkboxRows"
        class="text-center justify-content-center"
        @click="selectCheckbox"
      >
        <div class="form-check select-all-checkbox">
          <input
            class="form-check-input"
            type="checkbox"
            v-model="selectAllRows"
            value=""
            @change="onChange($event)"
          />
        </div>
      </th>

      <slot name="columns" :columns="columns">
        <th
          v-for="(column, key, index) in columns"
          :key="index"
          v-on="
            isSortableColumn(column)
              ? { click: () => $emit('update-sort', column) }
              : {}
          "
          class="text-center"
          v-bind:class="{ 'sort-cursor': isSortableColumn(column) }"
        >
          <slot name="column" :column="column">{{ column.label }}</slot>

          <template v-if="isSortableColumn(column)">
            <template v-if="!isSort(column)">
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
      </slot>
    </tr>
  </thead>
</template>

<script lang="ts">
import useEmitter from "@/composables/useEmitter";
import { defineComponent, onMounted, PropType, ref } from "vue";
import Column from "./Column.vue";

export default defineComponent({
  props: {
    columns: {
      type: Object as PropType<any[]>,
      default: () => [],
    },
    query: {
      type: Object as PropType<any>,
      default: () => ({}),
    },
    checkboxRows: {
      type: Boolean,
      default: false,
    },
  },
  components: { Column },
  emits: ["select-all-items", "update-sort"],
  setup(props, { emit }) {
    const emitter = useEmitter();
    const selectAllRows = ref(false);
    const onChange = (e: any) => emit("select-all-items", e.target.checked);
    const selectCheckbox = () => {
      emit("select-all-items", selectAllRows.value);
      selectAllRows.value = !selectAllRows.value;
    };
    const isSort = (column: any) => {
      return (
        props.query.sort &&
        props.query.sort.name &&
        props.query.sort.name === column.name
      );
    };

    const isSortableColumn = (column: any) => {
      if ("sort" in column) return column.sort;
      return false;
    };

    onMounted(() => {
      emitter.on("select-all-items-checkbox", (selectAll: boolean) => {
        selectAllRows.value = selectAll;
      });
    });

    return {
      selectAllRows,
      onChange,
      selectCheckbox,
      isSort,
      isSortableColumn,
    };
  },
});
</script>

<style scoped>
.select-all-checkbox {
  margin-bottom: 20px;
}
.sort-cursor {
  cursor: pointer;
}
</style>
