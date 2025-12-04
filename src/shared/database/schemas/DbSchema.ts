import { column, Schema, Table } from "@powersync/web";

/**
 *  Example Tables - Demonstrate architecture
 */

// Tasks table - demonstrates CRUD operations
const tasks = new Table(
  {
    title: column.text,
    description: column.text,
    status: column.text, // 'pending', 'in_progress', 'completed'
    priority: column.text, // 'low', 'medium', 'high'
    due_date: column.text,
    created_at: column.text,
    updated_at: column.text,
    created_by: column.text,
    updated_by: column.text,
  },
  { indexes: { status: ["status"], created_by: ["created_by"] } }
);

/**
 *  Schema
 */
export const DbSchema = new Schema({
  tasks,
});

/**
 *  Types
 */
export type Database = (typeof DbSchema)["types"];
export type TaskRecord = Database["tasks"];
