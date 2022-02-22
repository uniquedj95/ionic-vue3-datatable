<template>
  <div>
    <nav aria-label="Page navigation example">
      <ul class="pagination">
        <li
          :class="{ disabled: disablePreviousButton }"
          class="page-item"
          @click.prevent="pageHandler(currentPage - 1)"
        >
          <a class="page-link" href="" aria-label="Previous">
            <span aria-hidden="true">
              <slot name="paginataion-previous-button"> </slot>
            </span>
          </a>
        </li>
        <template v-if="!isEmpty">
          <li
            class="page-item"
            v-if="start > 3"
            @click.prevent="pageHandler(1)"
          >
            <a class="page-link" href=""> 1 </a>
          </li>
          <li class="page-item disabled" v-if="start > 3">
            <a class="page-link" href="">…</a>
          </li>
          <li
            class="page-item"
            v-for="index in range"
            :key="index"
            v-bind:class="{ active: index == currentPage }"
            @click.prevent="pageHandler(index)"
          >
            <a class="page-link" href="">{{ index }}</a>
          </li>
          <li class="page-item disabled" v-if="end < totalPages - 2">
            <a class="page-link" href="">…</a>
          </li>
          <li
            class="page-item"
            v-if="end < totalPages - 2"
            @click.prevent="pageHandler(totalPages)"
          >
            <a class="page-link" href=""> {{ totalPages }} </a>
          </li>
        </template>

        <template v-else>
          <li class="page-item disabled">
            <a class="page-link" href="">…</a>
          </li>
        </template>
        <li
          :class="{ disabled: disableNextButton }"
          class="page-item"
          @click.prevent="pageHandler(currentPage + 1)"
        >
          <a class="page-link" href="" aria-label="Next">
            <span aria-hidden="true">
              <slot name="paginataion-next-button"> </slot>
            </span>
          </a>
        </li>
        <!-- Number of rows per page starts here -->
        <div class="dropdown show per-page-dropdown">
          <a
            class="btn btn-primary dropdown-toggle"
            href="#"
            role="button"
            id="dropdownMenuLink"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            {{ perPage }}
          </a>

          <div class="dropdown-menu" aria-labelledby="dropdownMenuLink">
            <a
              v-for="(option, key, index) in perPageOptions"
              :key="index"
              class="dropdown-item"
              href=""
              @click.prevent="perPageHandler(option)"
              v-bind:class="{ active: option == perPage }"
            >
              {{ option }}
            </a>
          </div>
        </div>
        <!-- Number of rows per page ends here -->

        <div class="input-group col-sm-2">
          <input
            type="number"
            class="form-control"
            min="1"
            step="1"
            :max="totalPages"
            placeholder="Go to page"
            @keyup.enter="goToPage"
            v-model.number="pageToGo"
          />
        </div>
      </ul>
    </nav>
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
    const start = ref(props.currentPage + 0);
    const end = ref(0);
    const pageToGo = ref(0);
    const disablePreviousButton = computed(() => props.currentPage === start.value);
    const disableNextButton = computed(() => props.currentPage === end.value);
    const isEmpty = () => computed(() => props.total == 0);
    const range = computed(() => generateRange(start.value, end.value + 1));
    const totalPages = computed(() => Math.ceil(props.total / props.perPageItems));
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
        (range.value.includes(props.currentPage - 1) || props.currentPage === 1) &&
        (range.value.includes(props.currentPage + 1) ||
          props.currentPage === totalPages.value)
      ) {
        return;
      }

      //Current page is the start page minus one
      start.value = props.currentPage == 1 ? 1 : props.currentPage - 1;

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
ul.pagination {
  margin-bottom: 0;
}
.per-page-dropdown {
  margin-left: 8px;
}
</style>
