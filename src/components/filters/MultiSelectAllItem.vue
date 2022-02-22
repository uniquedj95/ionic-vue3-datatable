<template>
  <div>
    <a class="dropdown-item" href="" @click.prevent="handleSelect()">
      <div class="custom-control custom-checkbox">
        <input
          type="checkbox"
          class="custom-control-input checkbox"
          v-model="optionSelected"
        />
        <label class="custom-control-label">{{ text }}</label>
      </div>
    </a>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";

export default defineComponent({
  props: {
    isAllOptionsSelected: {
      type: Boolean,
      default: false,
    },
    text: {
      type: String,
      default: "Any",
    },
  },
  emits: ["selectOption", "deselectOption"],
  setup(props, { emit }) {
    const optionSelected = ref(false);
    const handleSelect = () => {
      if (optionSelected.value) {
        emit("deselectOption");
      } else {
        emit("selectOption");
      }
    };

    watch(
      () => props.isAllOptionsSelected,
      (newVal) => (optionSelected.value = newVal)
    );

    return {
      optionSelected,
      handleSelect,
    };
  },
});
</script>
