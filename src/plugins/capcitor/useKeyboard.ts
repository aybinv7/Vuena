import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { Capacitor } from "@capacitor/core";
import type Framework7 from "framework7";

/*
  This method does the following:
    - provides cross-platform view "shrinking" on keyboard open/close
    - hides keyboard accessory bar for all inputs except where it required
  */
export const useKeyboard = (f7: Framework7) => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  const $ = f7.$;

  if (Capacitor.getPlatform() === "ios") {
    Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    Keyboard.setScroll({ isDisabled: true });
  }

  Keyboard.addListener("keyboardWillShow", () => {
    f7.toolbar.hide(".toolbar-main-app", false);

    if (document.activeElement) {
      f7.input.scrollIntoView(
        document.activeElement as HTMLElement,
        0,
        true,
        true
      );
    }
  });

  Keyboard.addListener("keyboardDidShow", () => {
    if (document.activeElement) {
      f7.input.scrollIntoView(
        document.activeElement as HTMLElement,
        0,
        true,
        true
      );
    }
  });

  Keyboard.addListener("keyboardWillHide", () => {
    if (document.activeElement) {
      f7.input.scrollIntoView(
        document.activeElement as HTMLElement,
        0,
        true,
        true
      );
    }
  });

  Keyboard.addListener("keyboardDidHide", () => {
    f7.toolbar.show(".toolbar-main-app", true);

    if (
      document.activeElement &&
      $(document.activeElement).parents(".messagebar").length
    ) {
      return;
    }

    if (Capacitor.getPlatform() === "ios")
      Keyboard.setAccessoryBarVisible({ isVisible: true });
  });

  $(document).on(
    "touchstart",
    "input, textarea, select",
    function (e: any) {
      var nodeName = e.target.nodeName.toLowerCase();
      var type = e.target.type;
      var showForTypes = ["datetime-local", "time", "date", "datetime"];
      if (nodeName === "select" || showForTypes.indexOf(type) >= 0) {
        if (Capacitor.getPlatform() === "ios")
          Keyboard.setAccessoryBarVisible({ isVisible: true });
      } else {
        if (Capacitor.getPlatform() === "ios")
          Keyboard.setAccessoryBarVisible({ isVisible: false });
      }
    },
    true
  );
};
