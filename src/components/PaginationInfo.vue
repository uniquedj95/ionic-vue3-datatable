<template>
  <div class="pagination-info">
    <template v-if="totalRows !== 0">
      From 1 to {{ totalRows }} of {{ totalFilteredRows }} entries
    </template>
    <template v-else> No results found </template>
    <template> ({{ totalOriginalRows }} total records) </template>
    <template v-if="showSelectedRowsInfo">
      &nbsp;|&nbsp; {{ totalSelectedItems }} rows selected
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    totalRows: {
      type: Number,
      default: 0,
    },
    totalFilteredRows: {
      type: Number,
      default: 0,
    },
    totalOriginalRows: {
      type: Number,
      default: 0,
    },
    showSelectedRowsInfo: {
      type: Boolean,
      default: false,
    },
    totalSelectedItems: {
      type: Number,
      default: 0,
    },
  },
});
</script>

<style scoped>
.pagination-info {
  text-align:right;
  margin-right: .7rem;
}
</style>
