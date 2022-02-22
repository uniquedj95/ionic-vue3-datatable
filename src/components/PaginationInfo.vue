<template>
  <div class="text-right justify-content-center">
    <template v-if="currentPageRowsLength != 0">
      From 1 to {{ currentPageRowsLength }} of {{ filteredRowsLength }} entries
    </template>
    <template v-else> No results found </template>
    <template> ({{ originalRowsLength }} total records) </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    currentPageRowsLength: {
      type: Number,
      default: 0,
    },
    filteredRowsLength: {
      type: Number,
      default: 0,
    },
    originalRowsLength: {
      type: Number,
      default: 0,
    },
  },
});
</script>
