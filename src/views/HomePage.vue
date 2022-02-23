<template>
  <ion-page translucent>
    <ion-header color="light">
      <ion-toolbar>
        <ion-title>Ionic Vue 3 Datatables</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <data-table v-if="rows"
        :classes="classes"
        :rows="rows"
        :columns="columns"
        :config="config"
        :customFilters="customFilters"
        :actions="actions"
        @selectRow="onSelectRows"
        @refreshData="fetchData"
        @download="onDownload"
      />
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  loadingController,
} from "@ionic/vue";
import { defineComponent, onMounted, ref } from "vue";
import DataTable from "@/components/DataTable.vue";
import {
  TableActionsBtn,
  TableColumn,
  TableColumnFilter,
  TableConfig,
  TableCSSClasses,
} from "@/interfaces/datatable";

export default defineComponent({
  name: "HomePage",
  components: {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    DataTable,
  },
  setup() {
    const rows = ref<any[]>()
    const customFilters = ref<TableColumnFilter[]>([])
    const actions = ref<TableActionsBtn[]>([])
    const classes = ref<TableCSSClasses>({
      tableWrapper: "",
      table: ["table-striped my-class", "table-bordered my-class-two"],
      row: "my-row my-row2 function-class",
      cell: ["my-cell my-cell2", "text-danger"],
    });

    const columns = ref<TableColumn[]>([
      {
        label: "id",
        name: "id",
        filter: {
          type: "simple",
          placeholder: "id",
        },
        sort: true,
        rowClasses: "myrowclassone myrowclasstwo",
      },
      {
        label: "First Name",
        name: "firstName",
        filter: {
          type: "select",
          placeholder: "Select first name",
          options: [],
          mode: "multi",
          closeDropdownOnSelection: true,
          selectAllCheckbox: {
            visibility: true,
            text: "Select all",
          },
          init: {
            value: [244],
          },
        },
        sort: true,
        initialSort: false,
        sortCaseSensitive: false,
      },
      {
        label: "Last Name",
        name: "lastName",
        filter: {
          type: "select",
          placeholder: "Select first name",
          options: [],
          mode: "multi",
          closeDropdownOnSelection: true,
          selectAllCheckbox: {
            visibility: true,
            text: "Select all",
          },
          init: {
            value: [244],
          },
        },
        sort: true,
        initialSort: false,
        sortCaseSensitive: false,
      },
    ]);

    const config = ref<TableConfig>({
      pagination: true,
      paginationInfo: true,
      visibleButtons: 7,
      perPageItems: 10,
      currentPage: 1,
      checkboxRows: true,
      highlightRowHover: true,
      rowsSelectable: true,
      multiColumnSort: false,
      // highlight_row_hover_color:"grey",
      cardTitle: "Example datatable",
      globalSearch: {
        placeholder: "Enter custom Search text",
        visibility: true,
        caseSensitive: false,
        showClearButton: true,
        class: "test",
        // searchOnPressEnter: true,
        searchDebounceRate: 1000,
        // init: {
        //     value: "Christine"
        // }
      },
      perPageOptions: [5, 10, 20, 30, 50],
      showResetButton: true,
      showRefreshButton: true,
      serverMode: false,
      cardMode: true,
      selectedRowsInfo: true,
      preservePageOnDataChange: true,
    });

    const fetchData = async () => {
      const loader = await loadingController.create({
        message: "loading data..."
      })
      loader.present()
      setTimeout(() => {
        const users: any[] = [];
        for(let i = 1; i < 30; i++) {
          users.push({
            id: i,
            firstName: `first name${i}`,
            lastName: `last name${i}`
          })
        }
        rows.value = users
        loader.dismiss()
      }, 5000)
    }

    const onSelectRows = (payload: any) => {
      console.log(payload)
    }

    const onDownload = (payload: any) => {
      console.log(payload)
    }

    onMounted(async () => {
      await fetchData()
    })

    return {
      classes,
      columns,
      rows,
      config,
      customFilters,
      actions,
      fetchData,
      onSelectRows,
      onDownload,
    };
  },
});
</script>

<style scoped>
ion-content {
  background: white !important;
}
</style>
