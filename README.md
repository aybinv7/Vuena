# Vuena

Vuena is a modern, modular mobile-first application built with Vue 3, Framework7, and Capacitor for cross-platform deployment. This project follows a modular architecture with TypeScript, Pinia for state management, Vue I18n for internationalization, and Tailwind CSS for styling.

## Tech Stack

- Vue 3 with TypeScript
- Framework7 (lite-bundle) with Vue integration
- Vite as bundler
- Capacitor for mobile app builds (iOS/Android)
- Pinia for state management
- Vue I18n for internationalization
- Tailwind CSS for styling
- @intlify/unplugin-vue-i18n for i18n resources compilation
- unplugin-vue-components for automatic component imports
- unplugin-auto-import for automatic imports
- unplugin-imagemin for image optimization (on build)
- unplugin-turbo-console for enhanced console logging

## Project Structure

The project follows a modular architecture:

```
src/
├── modules/{module-name}/
│   ├── components/
│   ├── composables/
│   ├── router/
│   │   └── routes/
│   ├── services/
│   ├── stores/
│   └── views/
├── shared/
│   ├── components/
│   ├── composables/
│   ├── services/
│   ├── stores/
│   └── utils/
├── plugins/
├── router/
└── assets/
```

## Install Dependencies

First, install dependencies using pnpm:

```bash
pnpm install
```

## Build/Lint/Test Commands

### Development
- `pnpm run dev` - Start development server
- `pnpm start` - Alias for development server (runs `npm run dev`)

### Build
- `pnpm run build` - Build web app for production (runs with type checking)
- `pnpm run build-only` - Build web app without type checking
- `pnpm run build-capacitor-ios` - Build and copy to iOS capacitor project
- `pnpm run build-capacitor-android` - Build and copy to Android capacitor project
- `pnpm run ios` - Build and copy to iOS capacitor project
- `pnpm run ios-open` - Build, copy to iOS, and open in Xcode
- `pnpm run android` - Build and copy to Android capacitor project
- `pnpm run android-open` - Build, copy to Android, and open in Android Studio

### Preview
- `pnpm run preview` - Preview production build locally on port 4173

### Type Checking
- `pnpm run type-check` - Run TypeScript type checking (vue-tsc --noEmit)

### Other Commands
- `pnpm run postinstall` - Copy font files from node_modules to src/fonts/

## Architecture

### Modular Structure
- Each feature is organized in its own module within `src/modules/{module-name}/`
- Each module contains components, composables, router, services, stores, and views directories
- Route parameter arrays are named as `{module}Routes` (e.g., `homeRoutes`, `aboutRoutes`)

### Code Style Guidelines
- Use `@/*` alias for paths relative to `src/` directory (e.g., `@/modules/home/views/Home.vue`)
- Use `@modules/*` alias for paths relative to `src/modules/*` directory
- Vue components use PascalCase (e.g., `Home.vue`, `About.vue`)
- Composables follow `use{Feature}` pattern (e.g., `useAppTheme`, `useLanguageStore`)
- Store files use `use{Feature}.stores.ts` pattern (note the plural "stores")

### Auto-imports
- `useLocalStorage`, `computed`, `provide`, `inject`, `onMounted`, and other Vue composables are auto-imported
- No need to manually import these functions from 'vue' or other libraries
- Uses unplugin-auto-import for automatic API imports from Vue, Pinia, Vue Router, VueUse, and Vue I18n
- Framework7 specific auto-imports are configured through the getFramework7AutoImports function

### Component Auto-imports
- Uses unplugin-vue-components for automatic component discovery and imports
- Components from src/components, src/views, and module directories are automatically imported
- Supports .vue, .ts, and .tsx component files
- Uses Framework7VueResolver for Framework7 component resolution

### Internationalization (i18n)
- Uses Vue I18n for internationalization with @intlify/unplugin-vue-i18n plugin
- Locale files are located in src/locales/ directory
- Supports automatic compilation of i18n resources

### Image Optimization
- Uses unplugin-imagemin for automatic image optimization
- Supports optimization for JPG, JPEG, PNG, and WebP formats
- Configured with quality settings and progressive loading for optimized assets

### Development Tools
- Uses unplugin-turbo-console for enhanced console logging during development
- Provides better error tracking and debugging capabilities

## Capacitor Integration

This project supports mobile app builds for both iOS and Android using Capacitor:

1. Add capacitor platforms:
```bash
npx cap add ios && npx cap add android
```

2. Build for mobile:
```bash
pnpm run ios        # Build and copy to iOS
pnpm run android    # Build and copy to Android
```

Check out [official Capacitor documentation](https://capacitorjs.com) for more examples and usage.

## Assets

Assets (icons, splash screens) source images are located in the public directory. The project includes icons in various sizes in `public/icons/` and native assets in `public/native/`.

## Documentation & Resources

* [Framework7 Core Documentation](https://framework7.io/docs/)
* [Framework7 Vue Documentation](https://framework7.io/vue/)
* [Vue 3 Documentation](https://vuejs.org/)
* [Vite Documentation](https://vitejs.dev/)
* [Capacitor Documentation](https://capacitorjs.com/)
* [Pinia Documentation](https://pinia.vuejs.org/)

## Contributing

This project follows a modular architecture designed to scale with multiple developers. Each feature module is self-contained, making it easy for multiple developers to work simultaneously without conflicts.