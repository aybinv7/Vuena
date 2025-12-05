import type { InjectionKey, ComputedRef } from "vue";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";

export type AppTheme = "ios" | "md" | "auto";
export type AppMode = "light" | "dark";

export interface AppContext {
  darkMode: AppMode;
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  setDarkMode: (t: AppMode) => Promise<void>;
}

export const AppContextKey: InjectionKey<ComputedRef<AppContext>> =
  Symbol("AppContext");

export const useAppThemeProvider = () => {
  const darkMode = useLocalStorage<AppMode>(
    "dark-mode",
    navigator.userAgent.includes("dark") ? "dark" : "light"
  );

  const theme = useLocalStorage<AppTheme>("app-theme", "auto");

  const setTheme = (t: AppTheme) => {
    theme.value = t;
    f7.theme = t === "ios" ? "ios" : "md";
    window.location.reload();
  };

  const setDarkMode = async (d: AppMode) => {
    darkMode.value = d;
    f7.setDarkMode(d === "dark");

    if (Capacitor.isNativePlatform()) {
      await StatusBar.setStyle({
        style: d === "dark" ? Style.Dark : Style.Light,
      });
    }
  };

  const appContext = computed<AppContext>(() => ({
    theme: theme.value,
    darkMode: darkMode.value,
    setTheme,
    setDarkMode,
  }));

  provide(AppContextKey, appContext);

  onMounted(async () => {
    const windowF7: any = window;
    windowF7.setTheme = setTheme;
    await setDarkMode(darkMode.value);
  });

  return appContext;
};

export const useAppTheme = (): ComputedRef<AppContext> => {
  const context = inject(AppContextKey);

  if (!context) {
    throw new Error(
      "useAppTheme must be used within a component that has useAppThemeProvider called in a parent"
    );
  }

  return context;
};
