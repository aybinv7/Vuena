# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Debugging-specific Rules

### Capacitor Debugging
- Android back button handling is implemented in `src/plugins/capcitor/useAndroidBackButton.ts`
- The back button logic prioritizes closing modals (actions, dialogs, sheets, popups, login screens) before navigating back
- If no modals are open, it checks for searchbar, expandable cards, or view history before potentially exiting the app
- Keyboard handling is in `src/plugins/capcitor/useKeyboard.ts` and manages accessory bar visibility
- Splash screen automatically hides after 2 seconds in `src/plugins/capcitor/useSplashScreen.ts`

### Framework7 Console Access
- The `setTheme` function is globally available on `window` as `window.setTheme` for debugging
- This allows theme switching from browser console using `setTheme('ios')` or `setTheme('md')`
- Framework7 instance is available as `f7` in the console after initialization

### Logging and Error Handling
- The project uses `unplugin-turbo-console` for enhanced console logging
- Error dialogs use Framework7's dialog component, accessible via `f7.dialog.alert()`
- Router navigation errors can be monitored through the router's event system in App.vue

### Device Detection
- Capacitor device detection is available through `getDevice()` from Framework7
- The `device.capacitor` property indicates if running in a Capacitor environment
- This affects keyboard behavior and input focus handling

### Hidden Log Locations
- Capacitor plugin initialization logs appear in native device logs, not browser console
- Framework7 component lifecycle events are not automatically logged
- Route changes are handled in App.vue with `router.on("routeChanged")` but not logged by default

### Debugging Environment Variables
- The app uses `cross-env NODE_ENV=development` for development mode
- Capacitor plugins only initialize when `device.capacitor` is true
- Theme and dark mode settings are persisted in localStorage ("app-theme", "dark-mode")

### Component Debugging
- Framework7 components can be accessed via the global `f7` object in browser console
- Views are accessible via `f7.views` and routers via `f7.views.main.router`
- Modal components can be opened/closed manually using Framework7 API methods

### Performance Debugging
- The `assetsInlineLimit: 0` setting in vite.config.ts means no assets are inlined, which can affect loading performance
- Image optimization is configured through `unplugin-imagemin` with specific quality settings
- Route lazy loading occurs through dynamic imports, which can be monitored in network tab