<template>
  <F7List sortable class="!mt-3" v-if="filteredGroups.length > 0" media-list>
    <TransitionGroup
      name="list"
      tag="ul"
      @before-enter="onBeforeEnter"
      @enter="onEnter"
      @leave="onLeave"
    >
      <F7ListItem
        v-for="(group, index) in filteredGroups"
        :key="group.id"
        :data-index="index"
        :title="group.name || 'Untitled Group'"
        :subtitle="`${group.currency || 'USD'} • ${getMemberCount(
          group.id
        )} members`"
        link="#"
        :checkbox="isSelectionMode"
        :checked="selectedGroupIds.has(group.id)"
        :swipeout="!isSelectionMode"
        @click="handleGroupClick(group)"
        @taphold="onGroupHold(group)"
        @swipeout:deleted="deleteGroup(group.id)"
      >
        <template #media>
          <div
            style="background-color: rgb(157, 67, 36)"
            class="w-12 h-12 text-[rgb(157, 67, 36)] rounded-xl flex items-center justify-center text-white font-bold shadow-md transition-all duration-300 hover:scale-110"
          >
            {{ (group.name || "U").charAt(0).toUpperCase() }}
          </div>
        </template>

        <template #after>
          <TransitionGroup name="badge">
            <F7Badge
              v-if="getExpenseCount(group.id) > 0"
              :key="`badge-${group.id}`"
              color="blue"
            >
              {{ getExpenseCount(group.id) }}
            </F7Badge>
          </TransitionGroup>
        </template>

        <F7SwipeoutActions right>
          <F7SwipeoutButton color="blue" @click="editGroup(group)">
            <F7Icon f7="pencil" />
          </F7SwipeoutButton>
          <F7SwipeoutButton color="orange" @click="shareGroup(group)">
            <F7Icon f7="square_arrow_up" />
          </F7SwipeoutButton>
          <F7SwipeoutButton delete confirm-text="Delete this group?">
            <F7Icon f7="trash" />
          </F7SwipeoutButton>
        </F7SwipeoutActions>
      </F7ListItem>
    </TransitionGroup>
  </F7List>

  <!-- Empty State -->
  <F7Block v-else class="text-align-center margin-top">
    <Transition name="fade" mode="out-in">
      <div key="empty-state">
        <div>
          <F7Icon f7="person_3" size="80" color="gray" />
        </div>
        <h3 class="margin-top">
          {{ searchQuery ? "No groups found" : "No groups yet" }}
        </h3>
        <p class="text-color-gray">
          {{
            searchQuery
              ? "Try a different search term"
              : "Create your first group to get started"
          }}
        </p>
        <F7Button v-if="!searchQuery" fill large @click="emit('create-group')">
          <F7Icon f7="plus" />
          Create Group
        </F7Button>
      </div>
    </Transition>
  </F7Block>
</template>

<script setup lang="ts">
const emit = defineEmits(["create-group", "selection-change"]);

const groupsStore = useGroupsStore();
const { groups } = storeToRefs(groupsStore);

const searchQuery = ref("");
const memberCounts = ref<Record<string, number>>({});
const expenseCounts = ref<Record<string, number>>({});
const sortBy = ref<"name" | "created" | "members" | "expenses">("created");

// Selection Mode
const isSelectionMode = ref(false);
const selectedGroupIds = ref<Set<string>>(new Set());

const sortLabel = computed(() => {
  const labels = {
    name: "Name",
    created: "Recently Added",
    members: "Most Members",
    expenses: "Most Expenses",
  };
  return labels[sortBy.value];
});

const filteredGroups = computed(() => {
  let filtered = groups.value;

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (g) =>
        g.name?.toLowerCase().includes(query) ||
        g.currency?.toLowerCase().includes(query)
    );
  }

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy.value) {
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      case "members":
        return getMemberCount(b.id) - getMemberCount(a.id);
      case "expenses":
        return getExpenseCount(b.id) - getExpenseCount(a.id);
      case "created":
      default:
        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
    }
  });

  return sorted;
});

function cycleSortOrder() {
  const orders: Array<typeof sortBy.value> = [
    "created",
    "name",
    "members",
    "expenses",
  ];
  const currentIndex = orders.indexOf(sortBy.value);
  sortBy.value = orders[(currentIndex + 1) % orders.length] ?? "name";

  // Haptic feedatabaseack
  if (window.navigator.vibrate) {
    window.navigator.vibrate(10);
  }
}

// Animation hooks
function onBeforeEnter(el: any) {
  el.style.opacity = "0";
  el.style.transform = "translateX(-30px)";
}

function onEnter(el: any, done: any) {
  const delay = el.dataset.index * 50;
  setTimeout(() => {
    el.style.transition = "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
    el.style.opacity = "1";
    el.style.transform = "translateX(0)";
  }, delay);
  setTimeout(done, delay + 400);
}

function onLeave(el: any, done: any) {
  el.style.transition = "all 0.3s cubic-bezier(0.4, 0, 1, 1)";
  el.style.opacity = "0";
  el.style.transform = "translateX(30px) scale(0.9)";
  setTimeout(done, 300);
}

function openGroup(group: any) {
  f7.views.main.router.navigate(`/group/${group.id}`, {
    animate: true,
    transition: "f7-parallax",
  });
}

function onGroupHold(group: any) {
  if (!isSelectionMode.value) {
    isSelectionMode.value = true;
    selectedGroupIds.value.add(group.id);
    emitSelectionChange();
    if (navigator.vibrate) navigator.vibrate(50);
  }
}

function handleGroupClick(group: any) {
  if (isSelectionMode.value) {
    toggleGroupSelection(group.id);
  } else {
    openGroup(group);
  }
}

function toggleGroupSelection(id: string) {
  if (selectedGroupIds.value.has(id)) {
    selectedGroupIds.value.delete(id);
    if (selectedGroupIds.value.size === 0) {
      isSelectionMode.value = false;
    }
  } else {
    selectedGroupIds.value.add(id);
  }
  emitSelectionChange();
}

function exitSelectionMode() {
  isSelectionMode.value = false;
  selectedGroupIds.value.clear();
  emitSelectionChange();
}

function emitSelectionChange() {
  emit("selection-change", {
    isSelectionMode: isSelectionMode.value,
    selectedCount: selectedGroupIds.value.size,
  });
}

async function deleteSelectedGroups() {
  f7.dialog.confirm(
    `Delete ${selectedGroupIds.value.size} groups?`,
    async () => {
      const ids = Array.from(selectedGroupIds.value);
      try {
        await database.deleteFrom("groups").where("id", "in", ids).execute();
        f7.toast
          .create({
            text: "✓ Groups deleted",
            position: "center",
            closeTimeout: 2000,
          })
          .open();
        exitSelectionMode();
        await groupsStore.refreshGroups();
      } catch (error) {
        console.error("Error deleting groups:", error);
        f7.dialog.alert("Failed to delete groups");
      }
    }
  );
}

function editGroup(group: any) {
  f7.dialog.prompt("Group Name", group.name || "", async (newName) => {
    if (newName) {
      await database
        .updateTable("groups")
        .set({ name: newName })
        .where("id", "=", group.id)
        .execute();
      f7.toast
        .create({
          text: "✓ Group renamed!",
          position: "center",
          closeTimeout: 2000,
        })
        .open();
    }
  });
}

function shareGroup(group: any) {
  f7.dialog.alert(`Share link: fairshare.app/join/${group.id.substring(0, 8)}`);
}

async function deleteGroup(groupId: string) {
  await database.deleteFrom("groups").where("id", "=", groupId).execute();
  f7.toast
    .create({
      text: "✓ Group deleted",
      position: "center",
      closeTimeout: 2000,
    })
    .open();
}

function getMemberCount(groupId: string): number {
  return memberCounts.value[groupId] || 0;
}

function getExpenseCount(groupId: string): number {
  return expenseCounts.value[groupId] || 0;
}

async function loadCounts() {
  try {
    const membersResult = await database
      .selectFrom("members")
      .select((eb) => ["group_id", eb.fn.countAll().as("count")])
      .groupBy("group_id")
      .execute();

    memberCounts.value = Object.fromEntries(
      membersResult.map((row) => [row.group_id, Number(row.count)])
    );

    const expensesResult = await database
      .selectFrom("expenses")
      .select((eb) => ["group_id", eb.fn.countAll().as("count")])
      .groupBy("group_id")
      .execute();

    expenseCounts.value = Object.fromEntries(
      expensesResult.map((row) => [row.group_id, Number(row.count)])
    );
  } catch (error) {
    console.error("Error loading counts:", error);
  }
}

async function handleRefresh(done: any) {
  await groupsStore.refreshGroups();
  await loadCounts();
  setTimeout(() => {
    if (typeof done === "function") done();
    f7.toast
      .create({
        text: "✓ Refreshed",
        position: "center",
        closeTimeout: 1500,
      })
      .open();
  }, 1000);
}

defineExpose({
  searchQuery,
  handleRefresh,
  exitSelectionMode,
  deleteSelectedGroups,
});

onMounted(() => {
  loadCounts();
});
</script>
