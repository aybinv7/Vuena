import type { BaseEntity } from "@/shared/database/base";

/**
 * Task entity type
 */
export interface Task extends BaseEntity {
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  due_date?: string;
}
