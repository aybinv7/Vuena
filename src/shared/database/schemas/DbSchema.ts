import { column, Schema, Table } from "@powersync/web";

/**
 *  Tables
 */
// const members = new Table(
//   {
//     group_id: column.text,
//     user_id: column.text,
//     joined_at: column.text,
//   },
//   { indexes: { group: ["group_id"] } }
// );

/**
 *  Schema
 */
export const DbSchema = new Schema({
  // members,
});

/**
 *  Types
 */
export type Database = (typeof DbSchema)["types"];
// export type MemberRecord = Database["members"];
