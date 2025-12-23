import Framework7 from "framework7/lite-bundle";
import Framework7Vue from "framework7-vue";

import { configService } from "./shared/services/configService";
import App from "./App.vue";

import "./assets/css/icons.css";
import "./assets/css/app.css";
import openreplayPlugin from "./plugins/openreplay.plugin";

// Initialize dynamic configuration first
await configService.initialize();

Framework7.use(Framework7Vue);

const app = createApp(App);
app.use(powersyncPlugin);
app.use(piniaPlugin);
app.use(i18nPlugin);
await openreplayPlugin(app);

app.mount("#app");
