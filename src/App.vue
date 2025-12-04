<template>
  <F7App class="safe-areas" v-bind="f7Params">
    <LoginView v-if="!authStore.isAuthenticated" />

    <F7Views tabs animated class="safe-areas" v-else>
      <F7View id="view-home" main tab tab-active url="/"></F7View>
      <F7View id="view-about" main tab url="/about"></F7View>

      <!-- Main Tabbar -->
      <F7Toolbar tabbar icons bottom class="safe-area-bottom toolbar-main-app">
        <div class="toolbar-pane">
          <F7Link
            tab-link="#view-home"
            tab-link-active
            icon-ios="f7:house"
            icon-md="material:home"
            text="Home"
            ripple-color="transparent"
          />
          <F7Link
            tab-link="#view-about"
            icon-ios="f7:info"
            icon-md="material:info"
            text="About"
            ripple-color="transparent"
          />
        </div>
      </F7Toolbar>
    </F7Views>
  </F7App>
</template>

<script setup lang="ts">
import type Framework7 from "framework7";
import capacitorApp from "@/plugins/capacitor.plugin";

const device = getDevice();
const f7Params = framework7();
const authStore = useAuthStore();

onMounted(() => {
  // Initialize auth - will connect PowerSync when authenticated
  authStore.init();

  f7ready((f7: Framework7) => {
    if (device.capacitor) {
      capacitorApp.init(f7);
    }
  });
});
</script>
