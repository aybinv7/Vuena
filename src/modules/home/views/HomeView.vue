<template>
  <F7Page hide-toolbar-on-scroll>
    <F7Navbar title="Vuenna"> </F7Navbar>

    <p>{{ t("welcome") }}</p>
  </F7Page>
</template>

<script setup lang="ts">
const { t } = useI18n();
</script>
