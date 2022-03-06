<template>
  <th class="text-center justify-content-center" @click="$emit('selectAll')">
    <div class="custom-control custom-checkbox">
      <input
        type="checkbox"
        :indeterminate.prop="showIndeterminateState"
        class="custom-control-input checkbox"
        v-model="cAllRowsSelected"
        value=""
      />
      <label class="custom-control-label"></label>
    </div>
  </th>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";

export default defineComponent({
  props: {
    allRowsSelected: {
      type: Boolean,
      default: false,
    },
    currentPageSelectionCount: {
      type: Number,
      default: 0,
    },
  },
  emits: ["selectAll"],
  setup(props, { emit }) {
    const showIndeterminateState = computed(() => {
      return !props.allRowsSelected && props.currentPageSelectionCount > 0;
    });
    const cAllRowsSelected = computed({
      set: () => emit("selectAll"),
      get: () => props.allRowsSelected
    })
    return {
      showIndeterminateState,
      cAllRowsSelected
    };
  },
});
</script>

<style scoped>
.custom-control-label {
  vertical-align: top;
}
</style>
