# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Documentation-specific Context

### Misleading Project Name
- The project is named "VueF7" in the README and framework7.json, but the actual project directory is "VueF7"
- This discrepancy could cause confusion when referencing documentation or project-specific information

### Hidden Documentation Locations
- Framework7 configuration is in `framework7.json` but most custom configuration is in `src/plugins/framework7.plugin.ts`
- The actual theme and dark mode implementation is in `src/shared/composables/theme/useAppTheme.ts` rather than in the Framework7 config
- Capacitor plugins are organized in `src/plugins/capcitor/` (note the typo - should be "capacitor") with specific functionality in separate files

### Counterintuitive Code Organization
- The `useAppThemeProvider` and `useAppTheme` functions are in the same file but serve different purposes (provider vs consumer)
- Route configuration files return arrays named `{module}Routes` but these are combined in `src/router/index.ts` without that naming pattern
- Components are auto-registered via `unplugin-vue-components` but the configuration is in `vite.config.ts` with specific directory patterns

### Misleading Folder Names
- The `capcitor` directory in `src/plugins/capcitor/` is misspelled (should be "capacitor")
- The `resolvers` utility in `src/shared/utils/resolvers/resolvers.ts` handles Framework7 component resolution specifically, not general resolvers

### Important Context Not Evident from File Structure
- The project uses a "lite-bundle" of Framework7 which affects which components and features are available
- The `f7ready()` function is crucial for initialization timing but only used in App.vue
- Theme switching requires a full page reload (`window.location.reload()`) due to Framework7 limitations
- The project has both `src/fonts/` and `src/assets/fonts/` directories with similar content

### Auto-import Configuration
- The `.biomelintrc-auto-import.json` file contains the actual list of auto-imported functions
- Framework7-specific auto-imports are defined in `src/shared/utils/resolvers/resolvers.ts`
- Custom imports need to be added to the `AutoImport` plugin configuration in `vite.config.ts`

### Internationalization Structure
- Translation files are in `src/locales/` but the i18n plugin setup is in `src/plugins/i18n.plugin.ts`
- Language switching logic is in `src/shared/stores/useLanguage.stores.ts`
- RTL (right-to-left) support is configured but primarily managed through document direction attributes

### Component Registration
- Framework7 components are registered globally via `registerComponents(app)` in `src/main.ts`
- Custom components follow different registration patterns depending on their location
- The `Framework7VueResolver()` handles PascalCase, kebab-case, and camelCase component naming automatically