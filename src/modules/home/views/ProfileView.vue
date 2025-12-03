<template>
  <F7Page infinite>
    <F7Navbar large transparent title="Profile" />

    <!-- User Card -->
    <F7Card>
      <F7CardContent class="text-align-center">
        <div class="margin-vertical">
          <F7Icon f7="person_crop_circle_fill" size="80" color="blue" />
        </div>
        <h2>{{ user?.email }}</h2>
        <p class="text-color-gray">Member since {{ memberSince }}</p>
      </F7CardContent>
    </F7Card>

    <!-- Stats -->
    <F7BlockTitle>Your Statistics</F7BlockTitle>
    <F7List>
      <F7ListItem title="Total Groups" :after="stats.totalGroups.toString()">
        <template #media>
          <F7Icon f7="person_3_fill" color="blue" />
        </template>
      </F7ListItem>
      <F7ListItem
        title="Total Expenses"
        :after="stats.totalExpenses.toString()"
      >
        <template #media>
          <F7Icon f7="money_dollar_circle_fill" color="green" />
        </template>
      </F7ListItem>
      <F7ListItem title="Total Spent" :after="formatCurrency(stats.totalSpent)">
        <template #media>
          <F7Icon f7="chart_bar_fill" color="orange" />
        </template>
      </F7ListItem>
    </F7List>

    <!-- Settings -->
    <F7BlockTitle>Settings</F7BlockTitle>
    <F7List>
      <F7ListItem title="Notifications">
        <template #media>
          <F7Icon f7="bell_fill" color="red" />
        </template>
        <template #after>
          <F7Toggle
            :checked="notificationsEnabled"
            @change="toggleNotifications"
          />
        </template>
      </F7ListItem>

      <F7ListItem link title="Default Currency" :after="currency">
        <template #media>
          <F7Icon f7="money_dollar" color="green" />
        </template>
      </F7ListItem>

      <F7ListItem popup-open="#theme-popup" link title="Theme" :after="theme">
        <template #media>
          <F7Icon f7="paintbrush_fill" color="purple" />
        </template>
      </F7ListItem>
    </F7List>

    <!-- Debug Tools -->
    <F7BlockTitle>Debug Tools</F7BlockTitle>
    <F7List>
      <F7ListItem link title="Clear & Resync Database" @click="handleClearSync">
        <template #media>
          <F7Icon f7="arrow_clockwise_circle_fill" color="blue" />
        </template>
      </F7ListItem>

      <F7ListItem link title="View Logs" badge="Dev" badge-color="orange">
        <template #media>
          <F7Icon f7="doc_text_fill" color="gray" />
        </template>
      </F7ListItem>
    </F7List>

    <!-- Danger Zone -->
    <F7BlockTitle>Account</F7BlockTitle>
    <F7List>
      <F7ListItem link title="Sign Out" @click="handleSignOut">
        <template #media>
          <F7Icon f7="arrow_right_square_fill" color="red" />
        </template>
      </F7ListItem>
    </F7List>

    <F7Block class="text-align-center">
      <p class="text-color-gray">Version 1.0.0</p>
      <p class="text-color-gray">© 2025 FairShare</p>
    </F7Block>

    <HomePanel />
  </F7Page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth.store";
import { useGroupsStore } from "@/stores/groups.store";
import { f7 } from "framework7-vue";
import database from "@/shared/database/index";

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const groupsStore = useGroupsStore();

const notificationsEnabled = ref(true);
const currency = ref("USD");
const theme = ref("Auto");
const stats = ref({
  totalGroups: 0,
  totalExpenses: 0,
  totalSpent: 0,
});

const memberSince = computed(() => {
  if (!user.value?.created_at) return "Recently";
  return new Date(user.value.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
});

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

async function loadStats() {
  try {
    const userId = user.value?.id;
    if (!userId) return;

    // Count groups
    const groupsResult = await database.execute(
      "SELECT COUNT(*) as count FROM members WHERE user_id = ?",
      [userId]
    );
    stats.value.totalGroups = groupsResult.rows?.item(0)?.count || 0;

    // Count expenses
    const expensesResult = await database.execute(
      "SELECT COUNT(*) as count, SUM(amount) as total FROM expenses WHERE paid_by = ?",
      [userId]
    );
    stats.value.totalExpenses = expensesResult.rows?.item(0)?.count || 0;
    stats.value.totalSpent = expensesResult.rows?.item(0)?.total || 0;
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

function toggleNotifications(e: any) {
  notificationsEnabled.value = e.target.checked;
  f7.toast
    .create({
      text: notificationsEnabled.value
        ? "Notifications enabled"
        : "Notifications disabled",
      position: "center",
      closeTimeout: 2000,
    })
    .open();
}

async function handleClearSync() {
  f7.dialog.confirm(
    "This will clear your local database and resync from Supabase. Continue?",
    async () => {
      f7.preloader.show();
      try {
        await groupsStore.clearAndResync();
        await loadStats();
        f7.toast
          .create({
            text: "✓ Database cleared and resynced!",
            position: "center",
            closeTimeout: 2000,
          })
          .open();
      } catch (error) {
        f7.dialog.alert("Error resyncing database");
      } finally {
        f7.preloader.hide();
      }
    }
  );
}

function handleSignOut() {
  f7.dialog.confirm("Are you sure you want to sign out?", async () => {
    await authStore.logout();
  });
}

onMounted(() => {
  loadStats();
});
</script>
