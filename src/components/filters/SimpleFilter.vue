<template>
  <div class="form-group has-clear-right">
    <span
      v-if="showClearButton"
      class="form-control-feedback simple-filter-clear"
      @click="clearFilter"
    >
      <slot name="simple-filter-clear-icon"> </slot>
    </span>
    <input
      v-if="filterOnPressEnter"
      type="text"
      v-model="simpleFilterInput"
      class="form-control"
      :placeholder="column.filter?.placeholder || ''"
      @keyup.enter="updateFilterHandler($event)"
    />
    <input
      v-else
      type="text"
      v-model="simpleFilterInput"
      class="form-control"
      :placeholder="column.filter?.placeholder || ''"
      @keyup.stop="updateFilter($event)"
    />
  </div>
</template>

<script lang="ts">
import useEmitter from "@/composables/useEmitter";
import { TableColumn } from "@/interfaces/datatable";
import { debounce } from "lodash";
import { computed, defineComponent, onMounted, PropType, ref } from "vue";

export default defineComponent({
  props: {
    column: {
      type: Object as PropType<TableColumn>,
      default: () => ({}),
    },
  },
  emits: ["clearFilter", "updateFilter"],
  setup(props, { emit }) {
    const emitter = useEmitter();
    const simpleFilterInput = ref(props.column.filter?.init?.value || "");
    const showClearButton = computed(() =>
      props.column.filter?.showClearButton !== undefined
        ? props.column.filter.showClearButton
        : true
    );

    const updateFilter = computed(() => {
      return debounce(updateFilterHandler, debounceRate.value);
    });

    const filterOnPressEnter = computed(
      () => props.column.filter?.filterOnPressEnter || false
    );

    const debounceRate = computed(() =>
      filterOnPressEnter.value && props.column.filter?.debounceRate
        ? props.column.filter.debounceRate
        : 60
    );

    const clearFilter = () => {
      (simpleFilterInput.value = ""), emit("clearFilter", props.column);
    };

    const updateFilterHandler = (event: any) =>
      emit("updateFilter", {
        value: event.target.value,
        column: props.column,
      });

    onMounted(() => {
      emitter.on("resetQuery", () => {
        if (simpleFilterInput.value) simpleFilterInput.value = "";
      });
    });

    return {
      filterOnPressEnter,
      debounceRate,
      showClearButton,
      updateFilter,
      clearFilter,
      simpleFilterInput,
      updateFilterHandler,
    };
  },
});
</script>

<style scoped>
.simple-filter-clear {
  cursor: pointer;
}

/* Styles for wrapping the search box */

.main {
  width: 50%;
  margin: 50px auto;
}

/* Bootstrap 4 text input with clear icon on the right */

.has-clear-right {
  position: relative;
}

.has-clear-right .form-control {
  padding-right: 2.375rem;
}

.has-clear-right .form-control-feedback {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  display: block;
  width: 2.375rem;
  height: 2.375rem;
  line-height: 2.375rem;
  text-align: center;
}

.has-clear-right .form-control-feedback:hover {
  color: red;
}
</style>
