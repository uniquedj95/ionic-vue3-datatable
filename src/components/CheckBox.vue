<template>
  <td
    class="text-center"
    v-on="!rowsSelectable ? { click: (event) => selectCheckbox(event) } : {}"
  >
    <div class="custom-control custom-checkbox">
      <input
        type="checkbox"
        class="custom-control-input checkbox"
        v-model="checkboxSelected"
      />
      <label class="custom-control-label"></label>
    </div>
  </td>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";

export default defineComponent({
  props: {
    rowsSelectable: {
      type: Boolean,
      default: false,
    },
    rowSelected: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["removeRow", "addRow"],
  setup(props, { emit }) {
    const checkboxSelected = ref(false);
    const selectCheckbox = (event: any) =>
      checkboxSelected.value
        ? emit("removeRow", event.shiftKey)
        : emit("addRow", event.shiftKey);

    watch(
      () => props.rowSelected,
      (newValue) => (checkboxSelected.value = newValue)
    );

    return {
      checkboxSelected,
      selectCheckbox,
    };
  },
});
</script>

<style scoped>
.custom-control-label {
  vertical-align: top;
}
</style>
