import type { Kysely } from "kysely";

export interface Database {
  // members: MemberRecord;
}

export type KyselyDatabase = Kysely<Database>;

// export type {

//  MemberRecord,

// };
