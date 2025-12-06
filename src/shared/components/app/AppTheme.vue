<template>
  <F7Popup
    id="theme-popup"
    class="home-popup-swipe-handler"
    swipe-to-close="to-bottom"
    push
  >
    <F7Page>
      <template #fixed>
        <div class="swipe-handler"></div>
      </template>

      <div class="block-title block-title-medium">App mode</div>
      <div class="block block-strong inset">
        <div class="grid grid-cols-2 grid-gap">
          <div
            class="bg-color-white h-20 rounded-xl"
            :class="{ border: appTheme.darkMode === 'light' }"
            @click="appTheme.setDarkMode('light')"
          ></div>
          <div
            class="bg-color-black h-20 rounded-xl"
            @click="appTheme.setDarkMode('dark')"
            :class="{ border: appTheme.darkMode === 'dark' }"
          ></div>
        </div>
      </div>

      <div class="block-title block-title-medium">App theme</div>
      <div class="block block-strong inset">
        <div class="grid grid-cols-2 grid-gap">
          <div
            class="h-20 rounded-xl flex flex-col items-center justify-center"
            :class="{ border: appTheme.theme === 'ios' }"
            @click="appTheme.setTheme('ios')"
          >
            <F7Icon :size="64" ios="f7:logo_apple" md="material:apple" />
          </div>
          <div
            class="h-20 rounded-xl flex flex-col items-center justify-center"
            @click="appTheme.setTheme('md')"
            :class="{ border: appTheme.theme === 'md' }"
          >
            <F7Icon :size="64" ios="f7:logo_android" md="material:android" />
          </div>
        </div>
      </div>
    </F7Page>
  </F7Popup>
</template>

<script setup lang="ts">
const appTheme = useAppTheme();
</script>

<style scoped>
.home-popup-swipe-handler {
  --f7-popup-border-radius: 15px 15px 0 0;
  --f7-popup-tablet-border-radius: 15px;
  --f7-block-strong-border-color: transparent;
  height: calc(100% - var(--f7-navbar-height) - var(--f7-safe-area-top));
  top: calc(var(--f7-navbar-height) + var(--f7-safe-area-top));
}
.home-popup-swipe-handler .swipe-handler {
  background: var(--f7-page-bg-color);
}
.home-popup-swipe-handler .page-content {
  padding-top: 16px;
}

.swipe-handler {
  height: 16px;
  position: absolute;
  left: 0;
  width: 100%;
  top: 0;
  background: #fff;
  cursor: pointer;
  z-index: 10;
}
.swipe-handler:after {
  content: "";
  width: 96px;
  height: 8px;
  position: absolute;
  left: 50%;
  top: 12px;
  transform: translateX(-50%);
  border-radius: 3px;
  background: #666;
  transition: all 0.2s ease;
}
.swipe-handler:active:after {
  transform: translateX(-50%) scale(1.08);
  width: 110px;
}
</style>
