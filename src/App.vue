<template>
  <F7App v-bind="f7Params">
    <!-- Login Screen Overlay -->
    <LoginView v-if="!authStore.isAuthenticated" />

    <!-- Main App Structure -->
    <F7Views tabs animated class="safe-areas" v-else>
      <!-- Tab 1: Groups (Home) -->
      <F7View id="view-groups" main tab tab-active url="/"></F7View>

      <!-- Tab 2: Activity -->
      <F7View id="view-activity" tab url="/activity"></F7View>

      <!-- Tab 3: Profile -->
      <F7View id="view-profile" tab url="/profile"></F7View>

      <!-- Main Tabbar -->
      <F7Toolbar tabbar icons bottom class="safe-area-bottom toolbar-main-app">
        <div class="toolbar-pane">
          <F7Link
            tab-link="#view-groups"
            tab-link-active
            icon-ios="f7:person_2_fill"
            icon-md="material:group"
            text="Groups"
            ripple-color="transparent"
          />
          <F7Link
            tab-link="#view-activity"
            icon-ios="f7:graph_square_fill"
            icon-md="material:analytics"
            text="Activity"
            ripple-color="transparent"
          />
          <F7Link
            tab-link="#view-profile"
            icon-ios="f7:person_circle_fill"
            icon-md="material:account_circle"
            text="Profile"
            ripple-color="transparent"
          />
        </div>
      </F7Toolbar>
    </F7Views>
  </F7App>
</template>

<script setup lang="ts">
import type Framework7 from "framework7";
import { onMounted } from "vue";
import capacitorApp from "./plugins/capacitor.plugin";
import { framework7 } from "./plugins/framework7.plugin";
import databaseInitializer from "./shared/database/inittalizer.database";
import { useAuthStore } from "@/stores/auth.store";
import LoginView from "@/modules/auth/views/LoginView.vue";
const device = getDevice();
const f7Params = framework7();
const authStore = useAuthStore();

onMounted(() => {
  authStore.init();

  f7ready((f7: Framework7) => {
    if (device.capacitor) {
      capacitorApp.init(f7);
      databaseInitializer();
    }
  });
});
</script>
