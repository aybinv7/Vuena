import { wrapPowerSyncWithKysely } from "@powersync/kysely-driver";

export default wrapPowerSyncWithKysely<Database>(powerSyncDatabase);
