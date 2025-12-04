<template>
  <F7Page hide-toolbar-on-scroll>
    <F7Navbar title="Vuenna">
      <F7NavRight>
        <F7Link
          icon-ios="f7:sparkles"
          icon-md="material:auto_awesome"
          popup-open="#app-theme-popup"
        ></F7Link>
      </F7NavRight>
    </F7Navbar>

    <F7Block>
      <h1>{{ t("welcome") }}</h1>
      <p class="text-color-gray">
        Scalable ERP Template with PowerSync & Kysely
      </p>
    </F7Block>

    <F7Block class="text-align-center margin-top-half">
      <F7Button large fill href="/examples" color="blue">
        <F7Icon f7="lightbulb_fill" class="margin-right-half" />
        Try Interactive Examples
      </F7Button>
      <p class="text-color-gray margin-top-half">
        Explore composables, reactive queries, and database patterns in action
      </p>
    </F7Block>

    <F7BlockTitle>Features</F7BlockTitle>
    <F7List inset>
      <F7ListItem title="Offline-First Database" subtitle="PowerSync + SQLite">
        <template #media>
          <F7Icon f7="arrow_2_circlepath" color="green" />
        </template>
      </F7ListItem>
      <F7ListItem title="Type-Safe Queries" subtitle="Kysely ORM">
        <template #media>
          <F7Icon f7="checkmark_shield_fill" color="blue" />
        </template>
      </F7ListItem>
      <F7ListItem title="Reactive Composables" subtitle="Vue 3 Composition API">
        <template #media>
          <F7Icon f7="bolt_fill" color="orange" />
        </template>
      </F7ListItem>
      <F7ListItem
        title="Real-time Sync"
        subtitle="Automatic data synchronization"
      >
        <template #media>
          <F7Icon f7="antenna_radiowaves_left_right" color="purple" />
        </template>
      </F7ListItem>
    </F7List>

    <AppTheme />
  </F7Page>
</template>

<script setup lang="ts">
import AppTheme from "@/shared/components/theme/AppTheme.vue";

const { t } = useI18n();
</script>
