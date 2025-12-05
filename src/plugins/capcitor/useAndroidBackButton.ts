import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import type Framework7 from "framework7";

/*
  This method prevents back button tap to exit from app on android.
  In case there is an opened modal it will close that modal instead.
  In case there is a current view with navigation history, it will go back instead.
  */
export const useAndroidBackButton = (f7: Framework7) => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  const $ = f7.$;

  App.addListener("backButton", () => {
    if ($(".actions-modal.modal-in").length) {
      f7.actions.close(".actions-modal.modal-in");
      return;
    }
    if ($(".dialog.modal-in").length) {
      f7.dialog.close(".dialog.modal-in");
      return;
    }
    if ($(".sheet-modal.modal-in").length) {
      f7.sheet.close(".sheet-modal.modal-in");
      return;
    }
    if ($(".popover.modal-in").length) {
      f7.popover.close(".popover.modal-in");
      return;
    }
    if ($(".popup.modal-in").length) {
      if ($(".popup.modal-in>.view").length) {
        const currentView = f7.views.get(".popup.modal-in>.view");
        if (
          currentView &&
          currentView.router &&
          currentView.router.history.length > 1
        ) {
          currentView.router.back();
          return;
        }
      }
      f7.popup.close(".popup.modal-in");
      return;
    }
    if ($(".login-screen.modal-in").length) {
      f7.loginScreen.close(".login-screen.modal-in");
      return;
    }

    if ($(".page-current .searchbar-enabled").length) {
      f7.searchbar.disable(".page-current .searchbar-enabled");
      return;
    }

    if ($(".page-current .card-expandable.card-opened").length) {
      f7.card.close(".page-current .card-expandable.card-opened");
      return;
    }

    if ($(".panel.panel-in").length) {
      f7.panel.close(".panel.panel-in");
      return;
    }

    if ($(".page-current .sortable").length) {
      f7.sortable.disable(".page-current .sortable");
      return;
    }

    console.log("we hereeeeee", f7.views.current);

    const currentView = f7.views.current;

    if (currentView && currentView.name === "home") {
      console.log("currentView you want to exit on home ", currentView);
      f7.dialog.confirm(
        "Are you sure you want to exit the app?",
        () => {
          App.exitApp();
        },
        () => {
          return;
        }
      );
      return;
    }

    if (
      currentView &&
      currentView.router &&
      currentView.router.history.length > 1
    ) {
      console.log("currentView you want to exit on home ", currentView);
      currentView.router.back();
      return;
    }
  });
};
