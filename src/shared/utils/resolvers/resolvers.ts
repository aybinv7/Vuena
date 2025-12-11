import type { ComponentResolver } from "unplugin-vue-components/types";

/**
 * Framework7 Vue Component Resolver
 * Resolves F7 and f7- prefixed components
 */
export function Framework7VueResolver(): ComponentResolver {
  const framework7Components = [
    // Core components
    "f7-app",
    "f7-view",
    "f7-views",
    "f7-page",
    "f7-page-content",

    // Navigation
    "f7-navbar",
    "f7-nav-left",
    "f7-nav-right",
    "f7-nav-title",
    "f7-nav-title-large",
    "f7-toolbar",
    "f7-toolbar-pane",
    "f7-subnavbar",
    "f7-searchbar",

    // Layout
    "f7-row",
    "f7-col",

    // Lists
    "f7-list",
    "f7-list-group",
    "f7-list-item",
    "f7-list-item-row",
    "f7-list-item-cell",
    "f7-list-item-content",
    "f7-list-button",
    "f7-list-input",

    // Forms
    // "f7-form",
    // "f7-input",
    // "f7-textarea",
    // "f7-checkbox",
    // "f7-radio",
    "f7-toggle",
    // "f7-range",
    // "f7-stepper",
    // "f7-smart-select",

    // Buttons
    "f7-button",
    "f7-segmented",
    "f7-fab",
    "f7-fab-button",
    "f7-fab-buttons",

    // Cards
    "f7-card",
    "f7-card-header",
    "f7-card-content",
    "f7-card-footer",

    // Modals
    "f7-popup",
    "f7-popover",
    "f7-actions",
    "f7-action-group",
    "f7-action-button",
    "f7-sheet",

    //login screen
    "f7-login-screen",
    "f7-login-screen-title",

    // Navigation Elements
    "f7-panel",
    "f7-tabs",
    "f7-tab",
    "f7-link",

    // Media
    "f7-photo-browser",
    "f7-swiper",
    "f7-swiper-slide",

    //swipe
    "f7-swipeout",
    "f7-swipeout-actions",
    "f7-swipeout-button",
    "f7-swipeout-content",

    // Data
    "f7-accordion",
    "f7-accordion-item",
    "f7-accordion-toggle",
    "f7-accordion-content",
    "f7-contacts-list",
    "f7-virtual-list",
    "f7-list-index",

    // Chips & Badges
    "f7-chip",
    "f7-badge",

    // Progress & Loading
    "f7-preloader",
    "f7-progressbar",
    // "f7-skeleton-block",
    // "f7-skeleton-text",

    // Calendar & Picker
    // "f7-calendar",
    // "f7-picker",

    // Messages
    // "f7-messages",
    // "f7-message",
    // "f7-messagebar",
    // "f7-messagebar-attachment",
    // "f7-messagebar-attachments",
    // "f7-messagebar-sheet",
    // "f7-messagebar-sheet-image",

    // Other
    // "f7-timeline",
    // "f7-timeline-item",
    // "f7-timeline-year",
    // "f7-timeline-month",
    // "f7-data-table",
    // "f7-breadcrumbs",
    // "f7-breadcrumbs-item",
    // "f7-treeview",
    // "f7-treeview-item",
    // "f7-text-editor",
    // "f7-color-picker",
    // "f7-autocomplete",

    //icon
    "f7-icon",

    //block
    "f7-block",
    "f7-block-title",
  ];

  const toCamelCase = (str: string) => {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  };

  return {
    type: "component",
    resolve: (name: string) => {
      // Handle PascalCase F7 components (F7App -> f7-app)
      if (name.startsWith("F7") && name.length > 2) {
        const kebabName = name
          .replace(/^F7/, "f7-")
          .replace(/([a-z])([A-Z])/g, "$1-$2")
          .toLowerCase();

        if (framework7Components.includes(kebabName)) {
          return {
            name: toCamelCase(kebabName),
            from: "framework7-vue",
          };
        }
      }

      // Handle direct f7- prefixed components
      if (name.startsWith("f7-") && framework7Components.includes(name)) {
        return {
          name: toCamelCase(name),
          from: "framework7-vue",
        };
      }

      // Handle camelCase f7 components (f7App -> f7-app)
      if (name.match(/^f7[A-Z]/)) {
        const kebabName = name
          .replace(/([a-z])([A-Z])/g, "$1-$2")
          .toLowerCase();

        if (framework7Components.includes(kebabName)) {
          return {
            name: toCamelCase(kebabName),
            from: "framework7-vue",
          };
        }
      }
    },
  };
}

/**
 * Framework7 Auto Import Configuration
 * For utilities, APIs, and composables
 */
export function getFramework7AutoImports() {
  return {
    "framework7/lite": ["utils", "getDevice", "createStore", "Dom7", "request"],
    "framework7-vue": ["f7ready", "f7", "theme", "f7route", "f7router"],
  };
}
