import type { Kysely } from "kysely";
import type { BaseEntity, EntityCreate, EntityUpdate } from "./BaseEntity";

/**
 * Base Model Class
 *
 * Provides common CRUD operations for all entities.
 * Each module can extend this class for specific entity types.
 *
 * @example
 * ```typescript
 * class ContactModel extends BaseModel<Contact> {
 *   constructor(db: Kysely<Database>) {
 *     super(db, 'contacts');
 *   }
 *
 *   // Add custom methods
 *   async findByEmail(email: string) {
 *     return this.db.selectFrom(this.table)
 *       .selectAll()
 *       .where('email', '=', email)
 *       .executeTakeFirst();
 *   }
 * }
 * ```
 */
export class BaseModel<T extends BaseEntity> {
  protected db: Kysely<any>;
  protected table: string;

  constructor(db: Kysely<any>, table: string) {
    this.db = db;
    this.table = table;
  }

  /**
   * Find record by ID
   */
  async findById(id: string): Promise<T | undefined> {
    return this.db
      .selectFrom(this.table)
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst() as Promise<T | undefined>;
  }

  /**
   * Find all records (with optional filters)
   */
  async findAll(filters?: Partial<T>): Promise<T[]> {
    let query = this.db.selectFrom(this.table).selectAll();

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        query = query.where(key as any, "=", value);
      }
    }

    return query.execute() as Promise<T[]>;
  }

  /**
   * Create a new record
   */
  async create(data: EntityCreate<T>, userId?: string): Promise<T> {
    const now = new Date().toISOString();
    const record = {
      id: crypto.randomUUID(),
      ...data,
      created_at: now,
      updated_at: now,
      ...(userId && { created_by: userId, updated_by: userId }),
    };

    await this.db
      .insertInto(this.table)
      .values(record as any)
      .execute();

    return record as T;
  }

  /**
   * Update a record by ID
   */
  async update(
    id: string,
    data: EntityUpdate<T>,
    userId?: string
  ): Promise<T | undefined> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
      ...(userId && { updated_by: userId }),
    };

    await this.db
      .updateTable(this.table)
      .set(updateData as any)
      .where("id", "=", id)
      .execute();

    return this.findById(id);
  }

  /**
   * Delete a record by ID (hard delete)
   */
  async delete(id: string): Promise<void> {
    await this.db.deleteFrom(this.table).where("id", "=", id).execute();
  }

  /**
   * Soft delete a record by ID
   */
  async softDelete(id: string, userId?: string): Promise<void> {
    const deleteData: any = {
      deleted_at: new Date().toISOString(),
    };

    if (userId) {
      deleteData.deleted_by = userId;
    }

    await this.db
      .updateTable(this.table)
      .set(deleteData)
      .where("id", "=", id)
      .execute();
  }

  /**
   * Restore a soft-deleted record
   */
  async restore(id: string): Promise<void> {
    await this.db
      .updateTable(this.table)
      .set({
        deleted_at: null,
        deleted_by: null,
      } as any)
      .where("id", "=", id)
      .execute();
  }

  /**
   * Count records (with optional filters)
   */
  async count(filters?: Partial<T>): Promise<number> {
    let query = this.db
      .selectFrom(this.table)
      .select(this.db.fn.count("id").as("count"));

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        query = query.where(key as any, "=", value);
      }
    }

    const result = await query.executeTakeFirst();
    return Number(result?.count ?? 0);
  }

  /**
   * Check if record exists
   */
  async exists(id: string): Promise<boolean> {
    const result = await this.db
      .selectFrom(this.table)
      .select("id")
      .where("id", "=", id)
      .executeTakeFirst();

    return !!result;
  }

  /**
   * Bulk create records
   */
  async bulkCreate(records: EntityCreate<T>[], userId?: string): Promise<T[]> {
    const now = new Date().toISOString();
    const recordsWithMeta = records.map((record) => ({
      id: crypto.randomUUID(),
      ...record,
      created_at: now,
      updated_at: now,
      ...(userId && { created_by: userId, updated_by: userId }),
    }));

    await this.db
      .insertInto(this.table)
      .values(recordsWithMeta as any)
      .execute();

    return recordsWithMeta as T[];
  }

  /**
   * Upsert (insert or update) a record
   */
  async upsert(data: T, userId?: string): Promise<T> {
    const now = new Date().toISOString();
    const record = {
      ...data,
      updated_at: now,
      ...(userId && { updated_by: userId }),
    };

    await this.db
      .insertInto(this.table)
      .values(record as any)
      .onConflict((oc) => oc.column("id").doUpdateSet(record as any))
      .execute();

    return record;
  }

  /**
   * Get a query builder for this table
   * Useful for building custom queries
   *
   * @example
   * const query = model.query()
   *   .where('created_by', '=', userId)
   *   .orderBy('created_at', 'desc')
   *   .limit(10);
   * const results = await query.execute();
   */
  query() {
    return this.db.selectFrom(this.table).selectAll();
  }

  /**
   * Search records by text fields
   *
   * @example
   * const results = await model.search('john', ['name', 'email']);
   */
  async search(searchTerm: string, fields: (keyof T)[]): Promise<T[]> {
    if (!searchTerm) {
      return this.findAll();
    }

    const search = searchTerm.toLowerCase();

    return this.db
      .selectFrom(this.table)
      .selectAll()
      .where((eb) => {
        let condition = eb("id" as any, "=", ""); // Always false to start

        for (const field of fields) {
          condition = eb.or([
            condition,
            eb(field as string, "like", `%${search}%`),
          ]);
        }

        return condition;
      })
      .execute() as Promise<T[]>;
  }

  /**
   * Get table name
   */
  getTableName(): string {
    return this.table;
  }

  /**
   * Get database instance
   */
  getDb(): Kysely<any> {
    return this.db;
  }
}
