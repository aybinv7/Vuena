import { PowerSyncDatabase } from "@powersync/capacitor";
import { WASQLiteOpenFactory, WASQLiteVFS } from "@powersync/web";
import { DbSchema } from "./schemas/DbSchema";
import { wrapPowerSyncWithKysely } from "@powersync/kysely-driver";

export const powerSync = new PowerSyncDatabase({
  schema: DbSchema,
  database: new WASQLiteOpenFactory({
    dbFilename: import.meta.env.VITE_DB_FILENAME,
    vfs: WASQLiteVFS.OPFSCoopSyncVFS,
    flags: {
      enableMultiTabs: typeof SharedWorker !== "undefined",
    },
  }),
  flags: {
    enableMultiTabs: typeof SharedWorker !== "undefined",
  },
});

export const db = wrapPowerSyncWithKysely<Database>(powerSync);

export default powerSync;
