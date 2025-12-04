import Framework7 from "framework7/lite-bundle";
import Framework7Vue from "framework7-vue";

import App from "./App.vue";

import pinia from "./plugins/pinia.plugin";
import i18n from "./plugins/i18n.plugin";
import powerSync from "./plugins/powersync.plugin";

import "./assets/css/icons.css";
import "./assets/css/app.css";

Framework7.use(Framework7Vue);

const app = createApp(App);

app.use(powerSync);
app.use(pinia);
app.use(i18n);

app.mount("#app");
