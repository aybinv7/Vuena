# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Architecture-specific Constraints

### Module Architecture
- The application follows a modular architecture with feature modules in `src/modules/{module-name}/`
- Each module must contain components, composables, router, services, stores, and views directories
- Module routes are aggregated in `src/router/index.ts` and must follow the `{module}Routes` naming convention
- Cross-module dependencies should be avoided; shared functionality belongs in `src/shared/`

### Framework7 Integration Pattern
- The application uses Framework7's lite-bundle with Vue integration for performance
- Framework7 initialization happens in `src/App.vue` with device detection
- The `f7ready()` lifecycle is critical for proper initialization timing
- Theme switching requires page reload due to Framework7's architecture limitations

### State Management Architecture
- Pinia is used for state management with persisted state plugin configured globally
- Store files follow the `use{Feature}.stores.ts` naming pattern
- Authentication state is managed through localStorage with mock implementation in `auth.service.ts`
- Shared stores are in `src/shared/stores/` while module-specific stores are in module directories

### Dependency Injection System
- The theme system uses Vue's provide/inject pattern with `useAppThemeProvider` as provider
- Components consuming theme context must have a parent with the provider (enforced in `useAppTheme`)
- Injection key is defined as `AppContextKey` with proper typing using Vue's InjectionKey
- This pattern should be followed for other cross-cutting concerns

### Capacitor Integration Architecture
- Capacitor plugins are initialized through `src/plugins/capacitor.plugin.ts`
- Platform-specific functionality is handled through conditional logic based on `device.capacitor`
- Native features like back button, keyboard, and splash screen are managed through dedicated handlers
- The architecture assumes Capacitor for native functionality, not other solutions

### Routing Architecture
- Route lazy loading is implemented through dynamic imports in route configuration files
- The router configuration uses Framework7's routing system rather than Vue Router
- Each module's routes are defined separately and combined in the main router index
- Authentication guards are commented out but available in route configuration files

### Component Architecture
- Framework7 components are automatically registered and resolved through custom resolvers
- Components follow Vue 3 Composition API with `<script setup>` syntax
- Auto-registration is configured through `unplugin-vue-components` with specific directory patterns
- Custom components should be placed in appropriate module or shared component directories

### Performance Architecture
- Image optimization is handled through `unplugin-imagemin` with specific quality settings
- Assets are not inlined (`assetsInlineLimit: 0`) which affects initial load performance
- Component lazy loading through dynamic imports helps reduce initial bundle size
- The lite-bundle of Framework7 is used to minimize bundle size

### Internationalization Architecture
- Vue I18n is configured globally with support for English, French, and Arabic
- Language direction (RTL/LTR) is handled through HTML attribute changes
- Translation files are in `src/locales/` and automatically loaded via plugin configuration
- Language persistence is handled through localStorage