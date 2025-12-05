import routes from "@/router";
import { Capacitor } from "@capacitor/core";
import type { Framework7Parameters } from "framework7/types";

export const framework7 = (): Framework7Parameters => {
  const appTheme = useAppThemeProvider();
  return {
    name: "Vuena",

    theme: appTheme.value.theme,
    darkMode: appTheme.value.darkMode,

    routes: routes,

    touch: {
      tapHold: true,
      tapHoldDelay: 500,
      tapHoldPreventClicks: true,
    },

    input: {
      scrollIntoViewOnFocus: true,
      // scrollIntoViewCentered: false,
    },

    statusbar: {
      enabled: Capacitor.isNativePlatform(),
    },

    view: {
      animate: true,
    },

    colors: {
      primary: "#c96442",
    },

    panel: {
      swipe: true,
    },
  };
};
