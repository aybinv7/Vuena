import { PowerSyncDatabase } from "@powersync/capacitor";
import { WASQLiteOpenFactory, WASQLiteVFS } from "@powersync/web";

export const powerSyncDatabase = new PowerSyncDatabase({
  schema: AppSchema,
  database: new WASQLiteOpenFactory({
    dbFilename: "exampleVFS.db",
    vfs: WASQLiteVFS.OPFSCoopSyncVFS,
    flags: {
      enableMultiTabs: typeof SharedWorker !== "undefined",
    },
  }),
  flags: {
    enableMultiTabs: typeof SharedWorker !== "undefined",
  },
});
