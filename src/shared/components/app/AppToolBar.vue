<template>
  <F7Toolbar tabbar icons bottom class="safe-area-bottom">
    <F7Link
      tab-link="#view-groups"
      :tab-link-active="tabActive === 'groups'"
      icon-ios="f7:person_2_fill"
      icon-md="material:group"
      text="Groups"
      ripple-color="transparent"
    />
    <F7Link
      tab-link="#view-activity"
      :tab-link-active="tabActive === 'activity'"
      icon-ios="f7:graph_square_fill"
      icon-md="material:analytics"
      text="Activity"
      ripple-color="transparent"
    />
    <F7Link
      tab-link="#view-profile"
      :tab-link-active="tabActive === 'profile'"
      icon-ios="f7:person_circle_fill"
      icon-md="material:account_circle"
      text="Profile"
      ripple-color="transparent"
    />
  </F7Toolbar>
</template>
<script setup lang="ts">
const { tabActive } = defineProps({
  tabActive: {
    type: String,
    default: "groups",
  },
});
</script>
