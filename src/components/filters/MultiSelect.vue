<template>
  <div>
    <div class="dropdown">
      <a
        class="btn btn-secondary dropdown-toggle"
        href="#"
        role="button"
        :id="'multifilter_' + column.name"
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        {{ title }}
      </a>
      <div
        ref="dropdown_menu"
        class="dropdown-menu scrollable-menu"
        aria-labelledby="dropdownMenuLink"
      >
        <multi-select-all-item
          v-if="!isSingleMode && showSelectAllCheckbox"
          :text="selectAllCheckboxText"
          :isAllOptionsSelected="isAllOptionsSelected"
          @deselectAll="selectedOptionIndexes = []"
          @selectAllOoption="selectAllOptions"
        ></multi-select-all-item>
        <multi-select-item
          v-for="(option, key) in options"
          :key="key"
          :index="key"
          :option="option"
          :is-single-mode="isSingleMode"
          :selectedOptionIndexes="selectedOptionIndexes"
          @selectOption="addOption"
          @deselectOption="removeOption"
        ></multi-select-item>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import MultiSelectItem from "./MultiSelectItem.vue";
import MultiSelectAllItem from "./MultiSelectAllItem.vue";
import {
  computed,
  defineComponent,
  nextTick,
  onMounted,
  PropType,
  ref,
  watch,
} from "vue";
import { TableColumn } from "@/interfaces/datatable";
import useEmitter from "@/composables/useEmitter";
import { range } from "lodash";

export default defineComponent({
  props: {
    column: {
      type: Object as PropType<TableColumn>,
      default: () => ({}),
    },
    options: {
      type: Object as PropType<any[]>,
      default: () => [] as Array<any>,
    },
  },
  emits: ["updateMultiSelectFilter"],
  setup(props, { emit }) {
    const emitter = useEmitter();
    const selectedOptionIndexes = ref<any[]>([]);
    const canEmit = ref(false);
    const optionsCount = computed(() => props.options.length);
    const mode = computed(() => props.column.filter?.mode || "single");
    const isSingleMode = computed(() => mode.value == "single");

    const isAllOptionsSelected = computed(() => {
      return props.options.length === selectedOptionIndexes.value.length;
    });

    const showSelectAllCheckbox = computed(() => {
      return props.column.filter?.selectAllCheckbox?.visibility !== undefined
        ? props.column.filter?.selectAllCheckbox?.visibility
        : true;
    });

    const selectAllCheckboxText = computed(() => {
      return props.column.filter?.selectAllCheckbox?.text || "Select All";
    });

    const title = computed(() => {
      if (selectedOptionIndexes.value?.length === 0) {
        return props.column.filter?.placeholder || "Select options";
      }

      if (selectedOptionIndexes.value.length > 0 &&
        selectedOptionIndexes.value.length <= 1
      ) {
        return props.options[selectedOptionIndexes.value[0]].name;
      } else {
        return props.column.filter?.selectedText?.replace(
          "{number}",
          selectedOptionIndexes.value?.length.toString()
        );
      }
    });

    const resetSelectedOptions = () => {
      selectedOptionIndexes.value = [];
    };

    const selectAllOptions = () => {
      resetSelectedOptions();
      selectedOptionIndexes.value = range(props.options.length);
    };

    const addOption = (index: number) => {
      if (isSingleMode.value) {
        resetSelectedOptions();
        selectedOptionIndexes.value.push(index);
      } else {
        const res = selectedOptionIndexes.value.findIndex((i) => i === index);
        if (res === -1) {
          selectedOptionIndexes.value.push(index);
        }
      }
    };

    const removeOption = (index: number) => {
      if (isSingleMode.value) {
        resetSelectedOptions();
      } else {
        const res = selectedOptionIndexes.value.findIndex((i) => i === index);
        if (res > -1) {
          selectedOptionIndexes.value.splice(res, 1);
        }
      }
    };

    watch(selectedOptionIndexes, (newVal) => {
      if (!canEmit.value) return;
      let payload: Record<string, any> = {};
      payload.column = { ...props.column };
      payload.selectedOptions = props.options.filter((_option, index) =>
        newVal.includes(index)
      );
      emit("updateMultiSelectFilter", payload);
    });

    onMounted(() => {
      emitter.on("reset-query", () => (selectedOptionIndexes.value = []));
      if (!props.column.filter?.closeDropdownOnSelection) {
        emitter.on("click", (e: Event) => e.stopPropagation(), false);
      }
      let lastIndex = optionsCount.value - 1;
      if (props.column.filter?.init?.value) {
        if (isSingleMode.value) {
          let index = props.column.filter.init.value;
          if (index > lastIndex || index < 0) return;
          addOption(index);
        } else {
          if (Array.isArray(props.column.filter.init.value)) {
            props.column.filter.init.value.forEach((index) => {
              if (index > lastIndex || index < 0) return;
              addOption(index);
            });
          } else {
            console.log("Initial value for 'multi' mode should be an array");
          }
        }
      }
      nextTick(() => (canEmit.value = true));
    });

    return {
      selectedOptionIndexes,
      canEmit,
      optionsCount,
      mode,
      isSingleMode,
      isAllOptionsSelected,
      showSelectAllCheckbox,
      selectAllCheckboxText,
      title,
      selectAllOptions,
      addOption,
      removeOption,
      resetSelectedOptions,
    };
  },
  components: {
    MultiSelectItem,
    MultiSelectAllItem,
  },
});
</script>

<style scoped>
.scrollable-menu {
  height: auto;
  max-height: 200px;
  overflow-x: hidden;
}
</style>
