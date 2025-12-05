import type { Kysely } from "kysely";

export type KyselyDatabase = Kysely<Database>;
export type Database = (typeof AppSchema)["types"];

type GroupRecord = Database["groups"];
type MemberRecord = Database["members"];
type ExpenseRecord = Database["expenses"];
type SplitRecord = Database["splits"];
type SettlementRecord = Database["settlements"];

export type {
  GroupRecord,
  MemberRecord,
  ExpenseRecord,
  SplitRecord,
  SettlementRecord,
};
