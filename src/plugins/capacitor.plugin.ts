import type Framework7 from "framework7";

const capacitor = {
  f7: null as Framework7 | null,

  handleSplashscreen: useSplashscreen,
  handleAndroidBackButton: useAndroidBackButton,
  handleKeyboard: useKeyboard,
  handleStatusBar: useStatusBar,
  handleAppUpdater: useAppUpdater,

  init: async function (f7: Framework7) {
    capacitor.f7 = f7;

    capacitor.handleAndroidBackButton(f7);
    capacitor.handleSplashscreen();
    capacitor.handleKeyboard(f7);
    await capacitor.handleStatusBar(f7);
    await capacitor.handleAppUpdater();
  },
};

export default capacitor;
