<template>
  <div :class="tableWrapperClasses" style="margin: .4rem">
    <table class="table" :class="tableClasses">
      <thead>
        <tr>
          <template v-for="(column, index) in cColumns">
            <table-column
              v-if="canShowColumn(column)"
              :key="index"
              :column="column"
              :query="filterQuery"
              class="column-header"
              :class="columnClasses(column)"
              @updateSort="updateSortQuery(column)"
            />
          </template>
        </tr>
      </thead>
      <tbody>
        <table-row
          v-for="(row, index) in cRows"
          :key="index"
          :row="row"
          :columns="cColumns"
          :rowIndex="index"
          :highlightRowHover="highlightRowHover"
          :highlightRowHoverColor="highlightRowHoverColor"
          :propRowClasses="classes.row"
          :propCellClasses="classes.cell"
        />

        <tr v-show="cRows.length === 0">
          <td :colspan="headerColSpan">
            <div class="empty-results">No results found</div>
          </td>
        </tr>

        <tr v-if="showPaginationRow" class="footer-pagination-row">
          <td :colspan="headerColSpan">
            <pagination
              v-if="pagination"
              :currentPage="currentPage"
              :perPageItems="perPageItems"
              :perPageOptions="perPageOptions"
              :total="totalFilteredRows"
              :visibleButtons="visibleButtons"
              :totalOriginalRows="totalOriginalRows"
              :showSelectedRowsInfo="showSelectedRowsInfo"
              @updatePerPageItems="updatePerPageItems"
              @updateCurrentPage="updateCurrentPage"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>