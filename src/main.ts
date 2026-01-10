import Framework7 from "framework7/lite-bundle";
import Framework7Vue from "framework7-vue";

import App from "./App.vue";

import "./assets/css/icons.css";
import "./assets/css/app.css";
import openreplayPlugin from "./plugins/openreplay.plugin";

Framework7.use(Framework7Vue);

const app = createApp(App);
app.use(powersyncPlugin);
app.use(piniaPlugin);
app.use(i18nPlugin);
await openreplayPlugin(app);

app.mount("#app");
