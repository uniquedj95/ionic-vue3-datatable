<template>
  <div class="pagination">
    <div class="btn-group">
      <ion-button
        color="light"
        :disabled="disablePreviousButton"
        @click.prevent="pageHandler(currentPage - 1)"
        aria-label="Previous"
      >
        &laquo;
      </ion-button>
      <template v-if="isEmpty">
        <span disabled>...</span>
      </template>
      <template v-else>
        <ion-button
          v-if="start > 3"
          color="light"
          @click.prevent="pageHandler(1)"
        >
          1
        </ion-button>
        <span v-if="start > 3" disabled>...</span>
        <ion-button
          v-for="index in range"
          :key="index"
          :color="index === currentPage ? 'primary' : 'light'"
          @click.prevent="pageHandler(index)"
        >
          {{ index }}
        </ion-button>
        <span v-if="end < totalPages - 2" disabled>...</span>
        <ion-button
          v-if="end < totalPages - 2"
          color="light"
          @click.prevent="pageHandler(totalPages)"
        >
          {{ totalPages }}
        </ion-button>
      </template>
      <ion-button
        color="light"
        :disabled="disableNextButton"
        @click.prevent="pageHandler(currentPage + 1)"
        aria-label="Next"
      >
        <span aria-hidden="true">&raquo;</span>
      </ion-button>
    </div>
    <div class="page-filters">
      <div class="filter-item">
        <ion-label>items per page: </ion-label>
        <select class="per-page-options">
          <option
            v-for="(option, index) in perPageOptions"
            :key="index"
            :value="option"
            :selected="option === perPageItems"
            @click.prevent="perPageHandler(option)"
          >
            {{ option }}
          </option>
        </select>
      </div>
      <div class="filter-item">
        <ion-label>Go to page: </ion-label>
        <input
          type="number"
          min="1"
          step="1"
          :max="totalPages"
          @keyup.enter="goToPage"
          v-model.number="pageToGo"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { generateRange, isPositiveInteger } from "@/utils/Numbers";
import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  ref,
  watch,
} from "vue";

export default defineComponent({
  props: {
    currentPage: {
      type: Number,
      required: true,
    },
    perPageItems: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    visibleButtons: {
      type: Number,
      default: 7,
    },
    perPageOptions: {
      type: Object as PropType<number[]>,
      default: () => [5, 10, 15] as Array<number>,
    },
  },
  emits: ["update:currentPage", "update:perPageItems"],
  setup(props, { emit }) {
    const start = ref(props.currentPage);
    const end = ref(0);
    const pageToGo = ref(0);
    const disablePreviousButton = computed(() => {
      return props.currentPage === start.value;
    });
    const disableNextButton = computed(() => props.currentPage === end.value);
    const isEmpty = computed(() => props.total === 0);
    const range = computed(() => generateRange(start.value, end.value + 1));
    const totalPages = computed(() =>
      Math.ceil(props.total / props.perPageItems)
    );
    const perPageHandler = (option: any) => emit("update:perPageItems", option);
    const pageHandler = (index: number) => {
      if (index >= 1 && index <= totalPages.value) {
        emit("update:currentPage", index);
      }
    };
    const goToPage = () => {
      if (!pageToGo.value && isPositiveInteger(pageToGo.value)) {
        pageHandler(pageToGo.value);
      }
    };
    const calculatePageRange = (force = false) => {
      //Skip calculating if all pages can be shown
      if (totalPages.value <= props.visibleButtons) {
        start.value = 1;
        end.value = totalPages.value;
        return;
      }

      //Skip recalculating if the previous and next pages are already visible
      if (
        !force &&
        (range.value.includes(props.currentPage - 1) ||
          props.currentPage === 1) &&
        (range.value.includes(props.currentPage + 1) ||
          props.currentPage === totalPages.value)
      ) {
        return;
      }

      //Current page is the start page minus one
      start.value = props.currentPage === 1 ? 1 : props.currentPage - 1;

      //Reserved entries: firstpage, ellipsis (2x), prev. page, last page, current page
      end.value = start.value + props.visibleButtons - 5;

      //If the user navigates on page one or two, we set start to one (ellipsis pointless)
      //and can potentially shift up end
      if (start.value <= 3) {
        end.value += 3 - start.value;
        start.value = 1;
      }

      //If the user navigates on the last two pages or out of bounds, we can shift down start
      //This will also handle end overflow, substract 2 for ellipsis and last page
      if (end.value >= totalPages.value - 2) {
        start.value -= end.value - (totalPages.value - 2);
        end.value = totalPages.value;
      }

      //Handle start underflow
      start.value = Math.max(start.value, 1);
    };

    watch([() => props.currentPage, totalPages], () => calculatePageRange());
    onMounted(() => calculatePageRange(true));

    return {
      start,
      end,
      pageToGo,
      disablePreviousButton,
      disableNextButton,
      range,
      totalPages,
      isEmpty,
      perPageHandler,
      pageHandler,
      goToPage,
      calculatePageRange,
    };
  },
});
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: flex-start;
  justify-items: center;
}
.pagination .btn-group,
.pagination .page-filters .filter-item {
  margin: 0.5rem;
  display: flex;
  justify-content: flex-start;
}

.pagination ion-button {
  margin: 0.1rem;
}

.pagination .page-filters {
  display: flex;
  justify-content: flex-start;
  margin: 0.5rem;
}
h6 {
  margin-right: 0.5rem;
}
</style>
