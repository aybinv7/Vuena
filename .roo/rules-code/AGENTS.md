# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Code-specific Rules

### Auto-imports and VueUse Functions
- `useLocalStorage`, `computed`, `provide`, `inject`, `onMounted`, and other Vue composables are auto-imported via `unplugin-auto-import`
- These functions are configured in `vite.config.ts` with the `getFramework7AutoImports()` function
- No need to manually import these functions from 'vue' or other libraries
- Check `.biomelintrc-auto-import.json` for the complete list of auto-imported functions

### Framework7 Component Resolution
- Framework7 components can be used in both PascalCase (F7Page, F7Navbar) and kebab-case (f7-page, f7-navbar)
- The `Framework7VueResolver()` in `src/shared/utils/resolvers/resolvers.ts` handles the component resolution
- Components are automatically resolved from 'framework7-vue' package

### Route Configuration
- Each module has its own routes defined in `src/modules/{module}/router/routes/index.ts`
- Route arrays must be named as `{module}Routes` (e.g., `homeRoutes`, `aboutRoutes`)
- Async route loading uses dynamic imports with `.then()` for component resolution
- Route parameters use `Router.RouteParameters[]` type from Framework7

### Theme Provider Pattern
- The `useAppThemeProvider` composable must be called in a parent component to provide theme context
- `useAppTheme` hook can only be used within components that have a parent with the theme provider
- Theme and dark mode preferences are stored in localStorage with keys "app-theme" and "dark-mode"

### Import Aliases
- Use `@/*` for paths relative to `src/` directory (e.g., `@/modules/home/views/Home.vue`)
- Use `@/modules/*` for paths relative to `src/modules/*` directory
- These aliases are configured in `vite.config.ts` under resolve.alias

### Capacitor Plugin Integration
- Capacitor functionality is managed through `src/plugins/capacitor.plugin.ts`
- Android back button, keyboard, and splash screen handling are integrated automatically
- All Capacitor plugins are initialized in the main App component

### Component Structure
- Vue components use PascalCase naming (e.g., `Home.vue`, `About.vue`)
- Components use `<script setup>` syntax with TypeScript
- Framework7 components follow the F7 prefix convention (e.g., `F7Page`, `F7Navbar`)

### Store Files
- Store files use `use{Feature}.stores.ts` pattern (note the plural "stores")
- Stores are located in `src/shared/stores/` or `src/modules/{module}/stores/`
- Pinia with persisted state is configured globally

### Missing Imports in useAppTheme
- The `useAppTheme.ts` file is missing imports for `computed`, `provide`, `inject`, `onMounted`, and `useLocalStorage`
- These should be imported from 'vue' and '@vueuse/core' respectively
- The functions work due to auto-imports but explicit imports would be more clear