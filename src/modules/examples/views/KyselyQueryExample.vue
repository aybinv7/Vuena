<template>
  <F7Page>
    <F7Navbar title="useKyselyQuery Example" back-link="Back" />

    <F7Block>
      <h2>Reactive Kysely Query Demo</h2>
      <p class="text-color-gray">
        This demonstrates <code>useKyselyQuery</code> with PowerSync watchers.
        Changes to the database are reflected in real-time.
      </p>
    </F7Block>

    <!-- Search Bar -->
    <F7Block>
      <F7Searchbar
        v-model:value="searchQuery"
        placeholder="Search tasks..."
        :clear-button="true"
      />
    </F7Block>

    <!-- Stats -->
    <F7BlockTitle>Statistics</F7BlockTitle>
    <F7List inset>
      <F7ListItem title="Total Tasks" :after="String(totalCount)" />
      <F7ListItem title="Filtered Results" :after="String(filteredCount)" />
      <F7ListItem
        title="Current Page"
        :after="`${currentPage} / ${totalPages}`"
      />
      <F7ListItem title="Selected" :after="String(selectedCount)" />
    </F7List>

    <!-- Sort Controls -->
    <F7BlockTitle>Sorting</F7BlockTitle>
    <F7List inset>
      <F7ListItem title="Sort Field">
        <template #after>
          <F7Button small @click="setSortBy('title')">Title</F7Button>
          <F7Button small @click="setSortBy('created_at')">Date</F7Button>
          <F7Button small @click="setSortBy('status')">Status</F7Button>
        </template>
      </F7ListItem>
      <F7ListItem title="Sort Order">
        <template #after>
          <F7Button small @click="sortOrder = 'asc'">Asc</F7Button>
          <F7Button small @click="sortOrder = 'desc'">Desc</F7Button>
        </template>
      </F7ListItem>
    </F7List>

    <!-- Task List -->
    <F7BlockTitle>Tasks ({{ items.length }} on this page)</F7BlockTitle>
    <F7List inset v-if="items.length > 0">
      <F7ListItem
        v-for="task in items"
        :key="task.id"
        :title="task.title"
        :after="task.status"
        :checkbox="true"
        :checked="selectedIds.has(task.id)"
        @change="toggleSelection(task.id)"
      >
        <template #subtitle>
          Priority: {{ task.priority }} | {{ formatDate(task.created_at) }}
        </template>
      </F7ListItem>
    </F7List>

    <F7Block v-else class="text-align-center">
      <F7Icon f7="tray" size="48" color="gray" />
      <p class="text-color-gray">
        {{ loading ? "Loading..." : "No tasks found" }}
      </p>
    </F7Block>

    <!-- Pagination -->
    <F7Block v-if="totalPages > 1">
      <F7Segmented raised>
        <F7Button :disabled="!hasPreviousPage" @click="previousPage">
          Previous
        </F7Button>
        <F7Button disabled>Page {{ currentPage }}</F7Button>
        <F7Button :disabled="!hasNextPage" @click="nextPage">Next</F7Button>
      </F7Segmented>
    </F7Block>

    <!-- Actions -->
    <F7Block>
      <F7Button fill @click="refreshData">Refresh Data</F7Button>
      <F7Button fill color="green" @click="selectAll" v-if="items.length > 0">
        Select All
      </F7Button>
      <F7Button fill color="red" @click="deselectAll" v-if="selectedCount > 0">
        Deselect All ({{ selectedCount }})
      </F7Button>
    </F7Block>

    <!-- Error Display -->
    <F7Block v-if="error" class="text-color-red">
      <strong>Error:</strong> {{ error }}
    </F7Block>
  </F7Page>
</template>

<script setup lang="ts">
import { useKyselyQuery } from "@/shared/composables";
import { db } from "@/shared/database";
import type { Task } from "@/modules/examples/types";

// Use the useKyselyQuery composable
const {
  items,
  searchQuery,
  sortBy,
  sortOrder,
  setSortBy,
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  nextPage,
  previousPage,
  selectedIds,
  selectedCount,
  totalCount,
  filteredCount,
  toggleSelection,
  selectAll,
  deselectAll,
  loading,
  error,
  refresh,
} = useKyselyQuery<Task>(db, "tasks", {
  searchFields: ["title", "description"],
  defaultSort: "created_at",
  defaultSortOrder: "desc",
  pageSize: 10,
});

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString();
}

async function refreshData() {
  await refresh();
  f7.toast
    .create({
      text: "✓ Data refreshed",
      position: "center",
      closeTimeout: 2000,
    })
    .open();
}
</script>
