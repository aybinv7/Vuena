<template>
  <F7Page>
    <F7Navbar large transparent title="Activity" />

    <!-- Filter Chips -->
    <F7Block strong inset class="!m-4 !p-0">
      <F7Segmented strong>
        <F7Button :active="filter === 'all'" @click="filter = 'all'"
          >All</F7Button
        >
        <F7Button :active="filter === 'expenses'" @click="filter = 'expenses'"
          >Expenses</F7Button
        >
        <F7Button
          :active="filter === 'settlements'"
          @click="filter = 'settlements'"
          >Settled</F7Button
        >
      </F7Segmented>
    </F7Block>

    <!-- Activity Timeline -->
    <F7List v-if="filteredActivity.length > 0" media-list>
      <F7ListItem
        v-for="item in filteredActivity"
        :key="item.id"
        :title="item.title"
        :subtitle="item.subtitle"
        :text="item.groupName"
        :after="item.type === 'expense' ? formatCurrency(item.amount) : ''"
        link="#"
        @click="openGroup(item.groupId)"
      >
        <template #media>
          <div
            :class="`w-10 h-10 rounded-full flex items-center justify-center ${
              item.type === 'expense' ? 'bg-blue-100' : 'bg-green-100'
            }`"
          >
            <F7Icon
              :f7="
                item.type === 'expense'
                  ? 'money_dollar'
                  : 'checkmark_circle_fill'
              "
              :color="item.type === 'expense' ? 'blue' : 'green'"
              size="20"
            />
          </div>
        </template>
        <template #footer>
          <span class="text-color-gray">{{ formatDate(item.date) }}</span>
        </template>
      </F7ListItem>
    </F7List>

    <!-- Empty State -->
    <F7Block v-else class="text-align-center margin-top">
      <F7Icon f7="clock" size="64" color="gray" class="margin-bottom" />
      <h3>No Activity Yet</h3>
      <p class="text-color-gray">
        Join a group and add expenses to see activity here
      </p>
    </F7Block>
  </F7Page>
</template>

<script setup lang="ts">
const authStore = useAuthStore();
const filter = ref<"all" | "expenses" | "settlements">("all");
const activity = ref<any[]>([]);
let watchAbort: AbortController | null = null;

const filteredActivity = computed(() => {
  if (filter.value === "all") return activity.value;
  return activity.value.filter(
    (item) => item.type === filter.value.slice(0, -1)
  );
});

function formatCurrency(amount: number | null) {
  if (amount === null || amount === undefined) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function openGroup(groupId: string) {
  f7.views.main.router.navigate(`/group/${groupId}`);
}

async function watchActivity() {
  if (watchAbort) watchAbort.abort();
  watchAbort = new AbortController();

  try {
    const userId = authStore.user?.id;
    if (!userId) return;

    const query = `
      SELECT 
        e.id,
        e.description as title,
        e.amount,
        e.date,
        e.created_at,
        e.group_id as groupId,
        g.name as groupName,
        'expense' as type
      FROM expenses e
      INNER JOIN groups g ON e.group_id = g.id
      INNER JOIN members m ON g.id = m.group_id
      WHERE m.user_id = ?
      ORDER BY e.date DESC, e.created_at DESC
      LIMIT 50
    `;

    for await (const result of powerSyncDatabase.watch(query, [userId], {
      signal: watchAbort.signal,
    })) {
      const expenses = Array.from(result.rows?._array || result.rows || []);

      activity.value = expenses.map((exp: any) => ({
        ...exp,
        subtitle: `Added ${formatDate(exp.created_at)}`,
        date: exp.date || exp.created_at,
      }));
    }
  } catch (error: any) {
    if (error.name !== "AbortError") {
      console.error("Error watching activity:", error);
    }
  }
}

onMounted(() => {
  watchActivity();
});

onUnmounted(() => {
  if (watchAbort) watchAbort.abort();
});
</script>
