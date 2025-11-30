<template>
  <F7Page infinite ptr @ptr:refresh="handleRefresh">
    <F7Navbar
      @navbar:collapse="isNavbarCollapsed = true"
      @navbar:expand="isNavbarCollapsed = false"
      large
      transparent
      title="FairShare"
      :sliding="false"
    >
      <F7NavRight>
        <F7Button
          class="text-center"
          icon-ios="f7:plus_circle_fill"
          icon-md="material:add_circle"
          color="primary"
          round
          icon-size="34"
          @click="showCreateGroup = true"
        />
      </F7NavRight>

      <F7Subnavbar
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
        <F7Button
          class="text-center"
          icon-ios="f7:sort_down_circle_fill"
          icon-md="material:sort"
          color="primary"
          round
          icon-size="34"
          sortable-toggle=".sortable"
        />
      </F7Subnavbar>
    </F7Navbar>

    <GroupsList ref="groupsList" @create-group="showCreateGroup = true" />
    <CreateGroupSheet v-model:opened="showCreateGroup" />
  </F7Page>
</template>

<script setup lang="ts">
import AppToolBar from "@/shared/components/app/AppToolBar.vue";

const groupsStore = useGroupsStore();
const showCreateGroup = ref(false);
const groupsList = ref<any>(null);
const isNavbarCollapsed = ref(false);

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
