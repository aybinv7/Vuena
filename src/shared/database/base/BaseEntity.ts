/**
 * Base Entity Interface
 *
 * All database entities should extend this interface to ensure
 * consistent fields across the application.
 */
export interface BaseEntity {
  /**
   * Unique identifier (UUID v4)
   */
  id: string;

  /**
   * ISO 8601 timestamp of when the record was created
   */
  created_at: string;

  /**
   * ISO 8601 timestamp of when the record was last updated
   */
  updated_at: string;

  /**
   * User ID who created this record
   */
  created_by?: string;

  /**
   * User ID who last updated this record
   */
  updated_by?: string;
}

/**
 * Soft Deletable Entity Interface
 *
 * Extend this for entities that support soft deletion
 */
export interface SoftDeletableEntity extends BaseEntity {
  /**
   * ISO 8601 timestamp of when the record was soft deleted
   * NULL means the record is not deleted
   */
  deleted_at?: string | null;

  /**
   * User ID who soft deleted this record
   */
  deleted_by?: string | null;
}

/**
 * Organization-Scoped Entity Interface
 *
 * Multi-tenant entities should extend this to ensure
 * proper organization isolation
 */
export interface OrganizationEntity extends BaseEntity {
  /**
   * Organization ID this record belongs to
   * Used for multi-tenancy and RLS policies
   */
  organization_id: string;
}

/**
 * Auditable Entity Interface
 *
 * For entities requiring full audit trail
 */
export interface AuditableEntity extends SoftDeletableEntity {
  /**
   * JSON object containing the previous state before update
   * Useful for audit logs and change tracking
   */
  previous_values?: Record<string, unknown>;

  /**
   * Version number for optimistic locking
   */
  version?: number;
}

/**
 * Document Entity Interface
 *
 * Base interface for transactional documents (invoices, orders, etc.)
 */
export interface DocumentEntity
  extends OrganizationEntity,
    SoftDeletableEntity {
  /**
   * Document number (human-readable, sequential)
   */
  document_number: string;

  /**
   * Document status (draft, submitted, approved, etc.)
   */
  status: string;

  /**
   * Document date
   */
  document_date: string;

  /**
   * Total amount (calculated from lines)
   */
  total_amount: number;

  /**
   * Currency code (ISO 4217)
   */
  currency: string;
}

/**
 * Helper type to make all BaseEntity fields optional for updates
 */
export type EntityUpdate<T extends BaseEntity> = Partial<
  Omit<T, "id" | "created_at" | "created_by">
> & {
  updated_at: string;
  updated_by?: string;
};

/**
 * Helper type for creating new entities (omitting auto-generated fields)
 */
export type EntityCreate<T extends BaseEntity> = Omit<
  T,
  "id" | "created_at" | "updated_at"
> & {
  id?: string; // Optional if generated client-side
};
