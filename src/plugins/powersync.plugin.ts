import { createPowerSyncPlugin } from "@powersync/vue";

const powerSync = createPowerSyncPlugin({
  database: powerSyncDatabase,
});
export default powerSync;
