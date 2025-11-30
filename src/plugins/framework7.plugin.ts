import routes from "@/router";
import { getDevice } from "framework7";
import type { Framework7Parameters } from "framework7/types";

export const framework7 = (): Framework7Parameters => {
  const device = getDevice();
  const appTheme = useAppThemeProvider();
  return {
    name: "Vuena",

    theme: appTheme.value.theme,
    darkMode: appTheme.value.darkMode,

    routes: routes,

    input: {
      scrollIntoViewOnFocus: true,
      scrollIntoViewCentered: true,
    },

    statusbar: {
      iosOverlaysWebView: true,
      androidOverlaysWebView: true,
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
