import { generateRange } from "@/utils/Numbers";
import {
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonInput,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/vue";
import {
  computed,
  defineComponent,
  h,
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

    const fromEntries = computed(() => {
      if (props.currentPage === 1) return 1
      return (props.currentPage * props.perPageItems) - (props.perPageItems - 1)
    })

    const endOfEntries = computed(() => {
      if (props.currentPage === totalPages.value) return props.total
      return props.currentPage * props.perPageItems
    })
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

    return () => h(
      IonGrid, h(
        IonRow, [
          h(IonCol, { size: "8" }, h(
            "div", { class: "pagination" }, h(
              "div", { class: "btn-group" }, [
              h(IonButton, { color: "light", disabled: props.currentPage === start.value, onClick: () => pageHandler(props.currentPage - 1) }, h(
                'span', { style: { fontSize: '28px'}}, "«"
              )),
              props.total === 0
                ? h(IonButton, { disabled: true }, "...")
                : h('div', [
                  start.value > 3 && h(IonButton, { color: "light", onClick: () => pageHandler(1) }, 1),
                  start.value > 3 && h(IonButton, { color: "light", disabled: true }, '...'),
                  range.value.map(index => h(IonButton, { key: index, color: index === props.currentPage ? "primary" : "light", onClick: () => pageHandler(index) }, index)),
                  end.value < (totalPages.value - 2) && h(IonButton, { color: "light", disabled: true }, '...'),
                  end.value < (totalPages.value - 2) && h(IonButton, { color: "light", onClick: () => pageHandler(totalPages.value) }, totalPages.value),
                ]),
              h(IonButton, { color: "light", disabled: props.currentPage === end.value, onClick: () => pageHandler(props.currentPage + 1) },  h(
                'span', { style: { fontSize: '28px'}}, "»"
              )),
              h(IonItem, { class: "box", lines: "none", style: { '--min-height': '11px', marginLeft: '.5rem' } }, [
                h(IonLabel, "Go to page"),
                h(IonInput, {
                  type: "number",
                  min: 1,
                  max: totalPages.value,
                  value: props.currentPage,
                  style: { maxWidth: '45px' },
                  debounce: 200,
                  onIonChange: (e: Event) => pageHandler(parseInt((e.target as HTMLInputElement).value))
                }),
              ]),
              h(IonItem, { class: "box", lines: "none", style: { '--min-height': '11px', marginLeft: '.5rem' } }, [
                h(IonLabel, "Items per page"),
                h(
                  IonSelect,
                  { value: props.perPageItems, onIonChange: (e: Event) => perPageHandler(parseInt((e.target as HTMLInputElement).value)) },
                  props.perPageOptions.map((option, index) => h(IonSelectOption, { value: option, key: index }, option))
                ),
              ]),
            ]
            )
          )),
          h(IonCol, { size: "4", style: { marginTop: '1rem', textAlign: 'right'} }, props.total
            ? `Showing ${fromEntries.value} to ${endOfEntries.value} of ${props.total} entries`
            : "No results found"
          )
        ]
      )
    )
  },
});
