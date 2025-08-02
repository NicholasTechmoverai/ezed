<template>
  <n-space vertical class="p-4">
    <n-p>
      You have selected {{ checkedRowKeys.length }} row{{ checkedRowKeys.length !== 1 ? 's' : '' }}.
    </n-p>

    <n-data-table
      :columns="columns"
      :data="data"
      :pagination="pagination"
      :row-key="rowKey"
      v-model:checked-row-keys="checkedRowKeys"
    />
  </n-space>
</template>

<script setup>
import { ref, reactive } from 'vue'

// Mock data
const data = Array.from({ length: 46 }).map((_, index) => ({
  name: `Edward King ${index}`,
  age: 32,
  address: `London, Park Lane no. ${index}`
}))

// Row selection state
const checkedRowKeys = ref([])

// Pagination state
const pagination = reactive({
  page: 1,
  pageSize: 5,
  showSizePicker: true,
  pageSizes: [5, 10, 20],
  onChange: (page) => {
    pagination.page = page
  },
  onUpdatePageSize: (pageSize) => {
    pagination.pageSize = pageSize
    pagination.page = 1
  }
})

// Column definitions
const columns = [
  {
    type: 'selection',
    disabled: (row) => row.name === 'Edward King 3'
  },
  {
    title: 'Name',
    key: 'name'
  },
  {
    title: 'Age',
    key: 'age'
  },
  {
    title: 'Address',
    key: 'address'
  }
]

// Row key identifier
const rowKey = (row) => row.address
</script>
