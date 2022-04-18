<template>
  <ion-grid>
    <ion-row>
      <ion-col size="8">
        <div class="pagination">
          <div class="btn-group">
            <ion-button
              color="light"
              :disabled="currentPage === start"
              @click.prevent="pageHandler(currentPage - 1)"
              aria-label="Previous"
            >
              &laquo;
            </ion-button>
            <template v-if="isEmpty">
              <ion-button disabled>...</ion-button>
            </template>
            <template v-else>
              <ion-button
                v-if="start > 3"
                color="light"
                @click.prevent="pageHandler(1)"
              >
                1
              </ion-button>
              <ion-button v-if="start > 3" disabled color="light">...</ion-button>
              <ion-button
                v-for="index in range"
                :key="index"
                :color="index === currentPage ? 'primary' : 'light'"
                @click.prevent="pageHandler(index)"
              >
                {{ index }}
              </ion-button>
              <ion-button v-if="end < totalPages - 2" disabled color="light"
                >...</ion-button
              >
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
              :disabled="currentPage === end"
              @click.prevent="pageHandler(currentPage + 1)"
              aria-label="Next"
            >
              <span aria-hidden="true">&raquo;</span>
            </ion-button>
            <ion-item class="box" lines="none">
              <ion-label>Go to page: </ion-label>
              <ion-input
                type="number"
                min="1"
                :max="totalPages"
                :value="currentPage"
                @ionChange="(e) => pageHandler(parseInt(e.target.value))"
                style="max-width: 45px;"
                :debounce="200"
              />
            </ion-item>
            <ion-item class="box">
              <ion-label>items per page</ion-label>
              <ion-select :value="perPageItems" v-model="itemPerPage">
                <ion-select-option
                  v-for="(option, index) in perPageOptions"
                  :key="index"
                  :value="option"
                >
                  {{ option }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </div>
        </div>
      </ion-col>
      <ion-col size="4">
        <div class="pagination-info">
          <template v-if="total !== 0">
            Showing {{ fromEntries }} to {{ endOfEntries }} of {{ total }} entries
          </template>
          <template v-else> No results found </template>
          <template> ({{ totalOriginalRows }} total records) </template>
        </div>
      </ion-col>
    </ion-row>
  </ion-grid>
</template>

<script lang="ts">
import { generateRange } from "@/utils/Numbers";
import {
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonInput,
} from "@ionic/vue";
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
    totalOriginalRows: {
      type: Number,
      default: 0,
    },
  },
  components: {
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonInput,
  },
  emits: ["updateCurrentPage", "updatePerPageItems"],
  setup(props, { emit }) {
    const start = ref(props.currentPage);
    const end = ref(0);
    const itemPerPage = computed({
      set: (value) => emit("updatePerPageItems", value),
      get: () => props.perPageItems
    });

    const fromEntries = computed(() => {
      if(props.currentPage === 1) return 1
      return (props.currentPage * itemPerPage.value) - (itemPerPage.value - 1) 
    })
    
    const endOfEntries = computed(() => {
      if(props.currentPage === totalPages.value) return props.total
      return props.currentPage * itemPerPage.value
    })
    const isEmpty = computed(() => props.total === 0);
    const range = computed(() => generateRange(start.value, end.value + 1));
    const totalPages = computed(() => Math.ceil(props.total / props.perPageItems));
    const perPageHandler = (option: any) => emit("updatePerPageItems", option)

    const pageHandler = (index: number) => {
      if (index >= 1 && index <= totalPages.value) {
        emit("updateCurrentPage", index);
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
      fromEntries,
      endOfEntries,
      itemPerPage,
      range,
      totalPages,
      isEmpty,
      perPageHandler,
      pageHandler,
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
.pagination-info {
  text-align:right;
  margin: 1rem;
}

h6 {
  margin-right: 0.5rem;
}

ion-item {
  --min-height: 11px;
  margin-left: .5rem;
}
</style>
