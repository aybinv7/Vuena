import { BaseModel } from "@/shared/database/base";
import { db } from "@/shared/database";
import type { Task } from "../types";

/**
 * Task Model
 *
 * Demonstrates how to extend BaseModel for specific entities.
 * Provides database operations for tasks with Kysely.
 */
export class TaskModel extends BaseModel<Task> {
  constructor() {
    super(db, "tasks");
  }

  /**
   * Example custom query: Get tasks by status
   */
  async findByStatus(status: Task["status"]): Promise<Task[]> {
    return this.db
      .selectFrom(this.table)
      .selectAll()
      .where("status", "=", status)
      .orderBy("created_at", "desc")
      .execute() as Promise<Task[]>;
  }

  /**
   * Example custom query: Get high priority tasks
   */
  async getHighPriorityTasks(): Promise<Task[]> {
    return this.db
      .selectFrom(this.table)
      .selectAll()
      .where("priority", "=", "high")
      .where("status", "!=", "completed")
      .orderBy("due_date", "asc")
      .execute() as Promise<Task[]>;
  }

  /**
   * Example: Complete a task
   */
  async completeTask(id: string, userId?: string): Promise<Task | undefined> {
    return this.update(
      id,
      { status: "completed" as const, updated_at: new Date().toISOString() },
      userId
    );
  }
}

// Export singleton instance
export const taskModel = new TaskModel();
