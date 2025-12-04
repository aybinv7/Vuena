import { ref, type Ref } from "vue";
import type {
  BaseEntity,
  EntityCreate,
  EntityUpdate,
} from "@/shared/database/base";
import type { Task } from "@/modules/examples";

export interface EntityOperations<
  T extends BaseEntity,
  TCreate = EntityCreate<T>,
  TUpdate = EntityUpdate<T>
> {
  create: (data: TCreate) => Promise<T>;
  update: (id: string, data: TUpdate) => Promise<Task | undefined>;
  delete: (id: string) => Promise<void>;
  fetchById?: (id: string) => Promise<T | undefined>;
}

/**
 * Reusable composable for entity CRUD operations
 *
 * Provides common functionality for managing single entities:
 * - Loading states
 * - Error handling
 * - Optimistic updates
 * - Offline support
 *
 * @example
 * ```typescript
 * const {
 *   entity,
 *   loading,
 *   error,
 *   saveEntity,
 *   deleteEntity
 * } = useEntity(ContactsService, contactId);
 * ```
 */
export function useEntity<
  T extends BaseEntity,
  TCreate = EntityCreate<T>,
  TUpdate = EntityUpdate<T>
>(operations: EntityOperations<T, TCreate, TUpdate>, initialId?: string) {
  const entity = ref<T | null>(null) as Ref<T | null>;
  const loading = ref(false);
  const saving = ref(false);
  const deleting = ref(false);
  const error = ref<string | null>(null);

  /**
   * Load entity by ID
   */
  async function loadEntity(id: string) {
    if (!operations.fetchById) {
      console.warn("fetchById operation not provided");
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const result = await operations.fetchById(id);
      entity.value = result ?? null;
    } catch (e: any) {
      error.value = e.message ?? "Failed to load entity";
      console.error("Failed to load entity:", e);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create a new entity
   */
  async function createEntity(data: TCreate): Promise<T | null> {
    saving.value = true;
    error.value = null;

    try {
      const result = await operations.create(data);
      entity.value = result;
      return result;
    } catch (e: any) {
      error.value = e.message ?? "Failed to create entity";
      console.error("Failed to create entity:", e);
      throw e;
    } finally {
      saving.value = false;
    }
  }

  /**
   * Update existing entity
   */
  async function updateEntity(id: string, data: TUpdate) {
    saving.value = true;
    error.value = null;

    // Optimistic update
    const previousValue = entity.value;
    if (entity.value) {
      Object.assign(entity.value, data);
    }

    try {
      await operations.update(id, data);
    } catch (e: any) {
      // Rollback on error
      if (previousValue) {
        entity.value = previousValue;
      }
      error.value = e.message ?? "Failed to update entity";
      console.error("Failed to update entity:", e);
      throw e;
    } finally {
      saving.value = false;
    }
  }

  /**
   * Save entity (create or update)
   */
  async function saveEntity(
    data: TCreate | (TUpdate & { id?: string })
  ): Promise<T | null> {
    const id = (data as any).id;

    if (id) {
      await updateEntity(id, data as TUpdate);
      return entity.value;
    } else {
      return await createEntity(data as TCreate);
    }
  }

  /**
   * Delete entity
   */
  async function deleteEntity(id: string) {
    deleting.value = true;
    error.value = null;

    try {
      await operations.delete(id);
      entity.value = null;
    } catch (e: any) {
      error.value = e.message ?? "Failed to delete entity";
      console.error("Failed to delete entity:", e);
      throw e;
    } finally {
      deleting.value = false;
    }
  }

  /**
   * Reset state
   */
  function reset() {
    entity.value = null;
    loading.value = false;
    saving.value = false;
    deleting.value = false;
    error.value = null;
  }

  // Load initial entity if ID provided
  if (initialId && operations.fetchById) {
    loadEntity(initialId);
  }

  return {
    // State
    entity,
    loading,
    saving,
    deleting,
    error,

    // Actions
    loadEntity,
    createEntity,
    updateEntity,
    saveEntity,
    deleteEntity,
    reset,

    // Computed helpers
    isNew: computed(() => !entity.value?.id),
    hasChanges: ref(false), // Can be managed by form composable
  };
}
