<template>
  <F7Page
    hide-toolbar-on-scroll
    infinite
    :ptr="!isSelectionMode"
    @ptr:refresh="handleRefresh"
    :class="{ 'home-page': isSelectionMode }"
  >
    <F7Navbar
      @navbar:collapse="isNavbarCollapsed = true"
      @navbar:expand="isNavbarCollapsed = false"
      :large="!isSelectionMode"
      :transparent="!isSelectionMode"
      :title="isSelectionMode ? `${selectedCount} Selected` : 'FairShare'"
      :sliding="false"
    >
      <F7Subnavbar
        v-if="!isSelectionMode"
        :bg-color="!isNavbarCollapsed ? 'transparent' : ''"
        :inner="false"
      >
        <F7Searchbar
          class="search-groups"
          :custom-search="true"
          :disable-button="true"
          placeholder="Search groups..."
          :clear-button="true"
          :backdrop="false"
          @searchbar:search="handleSearch"
          @searchbar:clear="clearSearch"
        />
      </F7Subnavbar>

      <F7NavRight>
        <template v-if="!isSelectionMode">
          <F7Link
            class="!p-2"
            :icon-size="33"
            icon-ios="f7:sort_down_circle_fill"
            icon-md="material:sort"
            color="primary"
            round
            sortable-toggle=".sortable"
          />
          <F7Link
            class="!p-2"
            :icon-size="33"
            icon-ios="f7:plus_circle_fill"
            icon-md="material:add_circle"
            color="primary"
            round
            @click="showCreateGroup = true"
          />
        </template>
        <template v-else>
          <F7Link icon-f7="xmark" @click="exitSelectionMode" />

          <F7Link
            icon-f7="trash"
            color="red"
            @click="deleteSelectedGroups"
            v-if="selectedCount > 0"
          />
        </template>
      </F7NavRight>
    </F7Navbar>

    <GroupsList
      ref="groupsList"
      @create-group="showCreateGroup = true"
      @selection-change="handleSelectionChange"
    />
    <CreateGroupSheet v-model:opened="showCreateGroup" />
  </F7Page>
</template>

<script setup lang="ts">
const groupsStore = useGroupsStore();
const showCreateGroup = ref(false);
const groupsList = ref<any>(null);
const isNavbarCollapsed = ref(false);
const isSelectionMode = ref(false);
const selectedCount = ref(0);

function handleSelectionChange(state: {
  isSelectionMode: boolean;
  selectedCount: number;
}) {
  isSelectionMode.value = state.isSelectionMode;
  selectedCount.value = state.selectedCount;
}

function exitSelectionMode() {
  if (groupsList.value) {
    groupsList.value.exitSelectionMode();
  }
}

function deleteSelectedGroups() {
  if (groupsList.value) {
    groupsList.value.deleteSelectedGroups();
  }
}

function handleSearch(searchbar: Element, query: string) {
  if (groupsList.value) {
    groupsList.value.searchQuery = query;
  }
}

function clearSearch() {
  if (groupsList.value) {
    groupsList.value.searchQuery = "";
  }
}

async function handleRefresh(done: any) {
  await groupsStore.refreshGroups();

  done();
}

onMounted(() => {
  groupsStore.watchGroups();
});

onUnmounted(() => {
  groupsStore.stopWatching();
});
</script>

<style lang="less">
.home-page {
  .page-content {
    padding-top: 72px;
  }
}
</style>
