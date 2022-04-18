<template>
  <div>
    <a class="dropdown-item" href="" @click.prevent="handleSelect()">
      <div v-if="isSingleMode" class="custom-control custom-radio">
        <input
          type="radio"
          class="custom-control-input"
          v-model="selectedValue"
          :value="option.value"
        />
        <label class="custom-control-label">{{ option.name }}</label>
      </div>
      <div v-else class="custom-control custom-checkbox">
        <input
          type="checkbox"
          class="custom-control-input vbt-checkbox"
          v-model="optionSelected"
        />
        <label class="custom-control-label">{{ option.name }}</label>
      </div>
    </a>
  </div>
</template>

<script lang="ts">
import { ITableColumn } from "@/interfaces/datatable";
import { defineComponent, PropType, ref, watch } from "vue";

export default defineComponent({
  props: {
    column: {
      type: Object as PropType<ITableColumn>,
      default: () => ({}),
    },
    option: {
      type: Object,
      default: () => ({
        name: "option one",
        value: "option one",
      }),
    },
    index: {
      type:  Number,
      default: 0,
    },
    isSingleMode: {
      type: Boolean,
      default: true,
    },
    isAllOptionsSelected: {
      type: Boolean,
      default: false,
    },
    selectedOptionIndexes: {
      type: Array,
      default: () => ([]),
    },
  },
  emits: ["deselect", "select"],
  setup(props, { emit }) {
    const optionSelected = ref(false);
    const selectedValue = ref("");

    const handleSelect = () => {
      emit(optionSelected.value ? "deselect" : "select", props.index);
    };

    watch(
      () => props.selectedOptionIndexes,
      (newArr) => {
        optionSelected.value = newArr.includes(props.index);
      },
      { deep: true }
    );

    watch(
      optionSelected,
      (newVal) => (selectedValue.value = newVal ? props.option.value : "")
    );

    return {
      optionSelected,
      selectedValue,
      handleSelect,
    };
  },
});
</script>
