<template>
  <F7Page>
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

    <!-- Updates -->
    <F7BlockTitle>Updates</F7BlockTitle>
    <F7List>
      <F7ListItem
        link
        title="Check for Updates"
        :footer="updateStatus"
        @click="handleCheckUpdate"
      >
        <template #media>
          <F7Icon f7="arrow_down_circle_fill" color="blue" />
        </template>
        <template #after>
          <F7Preloader v-if="isCheckingUpdate" size="20" />
          <F7Badge v-else-if="updateAvailable" color="red">New</F7Badge>
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
      <p class="text-color-gray">
        Version {{ appVersion }}
        <span v-if="bundleVersion && bundleVersion !== 'builtin'">
          ({{ bundleVersion }})</span
        >
      </p>
      <p class="text-color-gray">{{ appEnvironment }} • {{ appChannel }}</p>
      <p class="text-color-gray">© 2025 Vuena</p>
    </F7Block>

    <AppTheme />
  </F7Page>
</template>

<script setup lang="ts">
import AppTheme from "@/shared/components/app/AppTheme.vue";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useUpdater } from "@/shared/services/updater/useUpdater";

const authStore = useAuthStore();
const groupsStore = useGroupsStore();

const { user } = storeToRefs(authStore);
const { check, isChecking, updateAvailable, currentUpdate } = useUpdater();

const notificationsEnabled = ref(true);
const currency = ref("USD");
const theme = ref("Auto");
const stats = ref({
  totalGroups: 0,
  totalExpenses: 0,
  totalSpent: 0,
});

// App version info
const appVersion = ref("1.0.0");
const bundleVersion = ref("");
const appEnvironment = ref(import.meta.env.VITE_ENVIRONMENT || "dev");
const appChannel = ref(import.meta.env.VITE_UPDATE_CHANNEL || "prod");

// Update status
const isCheckingUpdate = computed(() => isChecking.value);
const updateStatus = computed(() => {
  if (isChecking.value) return "Checking...";
  if (updateAvailable.value && currentUpdate.value) {
    return `Update available: v${currentUpdate.value.version}`;
  }
  return "Tap to check for updates";
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

async function loadAppVersion() {
  try {
    if (Capacitor.isNativePlatform()) {
      const info = await App.getInfo();
      appVersion.value = info.version;

      // Get current OTA bundle version
      const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
      const current = await CapacitorUpdater.current();
      bundleVersion.value = current.bundle.version;
    } else {
      // Web: use package.json version via env
      appVersion.value = import.meta.env.VITE_APP_VERSION || "1.0.0";
    }
  } catch (error) {
    console.error("Error getting app version:", error);
  }
}

async function loadStats() {
  try {
    const userId = user.value?.id;
    if (!userId) return;

    // Count groups
    const groupsResult = await powerSyncDatabase.execute(
      "SELECT COUNT(*) as count FROM members WHERE user_id = ?",
      [userId]
    );
    stats.value.totalGroups = groupsResult.rows?.item(0)?.count || 0;

    // Count expenses
    const expensesResult = await powerSyncDatabase.execute(
      "SELECT COUNT(*) as count, SUM(amount) as total FROM expenses WHERE paid_by = ?",
      [userId]
    );
    stats.value.totalExpenses = expensesResult.rows?.item(0)?.count || 0;
    stats.value.totalSpent = expensesResult.rows?.item(0)?.total || 0;
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

async function handleCheckUpdate() {
  if (isChecking.value) return;

  try {
    await check(false); // false = not silent, will show dialog if update found

    if (!updateAvailable.value) {
      f7.toast
        .create({
          text: "You're on the latest version!",
          position: "center",
          closeTimeout: 2000,
        })
        .open();
    }
  } catch (error) {
    console.error("Error checking for updates:", error);
    f7.toast
      .create({
        text: "Failed to check for updates",
        position: "center",
        closeTimeout: 2000,
      })
      .open();
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
  loadAppVersion();
});
</script>
