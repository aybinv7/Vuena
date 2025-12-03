import {
  ref,
  computed,
  watch,
  type Ref,
  type ComputedRef,
  onUnmounted,
} from "vue";
import type { Kysely, SelectQueryBuilder } from "kysely";
import type { BaseEntity } from "@/shared/database/base";
import { powerSync } from "@/shared/database";

/**
 * Return type for useKyselyQuery composable
 */
export interface UseKyselyQueryReturn<T extends BaseEntity> {
  // Display items
  items: Ref<T[]>;
  allItems: ComputedRef<T[]>;

  // Search
  searchQuery: Ref<string>;

  // Sorting
  sortBy: Ref<keyof T>;
  sortOrder: Ref<"asc" | "desc">;
  setSortBy: (field: keyof T) => void;

  // Pagination
  currentPage: Ref<number>;
  totalPages: ComputedRef<number>;
  hasNextPage: ComputedRef<boolean>;
  hasPreviousPage: ComputedRef<boolean>;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  resetPagination: () => void;

  // Selection
  selectedIds: Ref<Set<string>>;
  selectedCount: ComputedRef<number>;
  allSelected: ComputedRef<boolean>;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  toggleSelectAll: () => void;

  // Stats
  totalCount: ComputedRef<number>;
  filteredCount: ComputedRef<number>;

  // Loading state
  loading: Ref<boolean>;
  error: Ref<string | null>;

  // Refresh
  refresh: () => Promise<void>;
}

/**
 * Reactive Kysely query composable with PowerSync integration
 *
 * Provides reactive database queries with:
 * - SQL-level filtering/searching
 * - SQL-level sorting
 * - SQL-level pagination
 * - PowerSync watch for real-time updates
 * - Selection state management
 *
 * @example
 * ```typescript
 * const { items, searchQuery, sortBy, refresh } = useKyselyQuery(
 *   db,
 *   'groups',
 *   {
 *     searchFields: ['name'],
 *     defaultSort: 'name',
 *     filters: { created_by: userId }
 *   }
 * );
 * ```
 */
export function useKyselyQuery<T extends BaseEntity>(
  db: Kysely<any>,
  tableName: string,
  options?: {
    searchFields?: (keyof T)[];
    defaultSort?: keyof T;
    defaultSortOrder?: "asc" | "desc";
    pageSize?: number;
    filters?: Partial<T>;
  }
): UseKyselyQueryReturn<T> {
  // Reactive state
  const searchQuery = ref("");
  const sortBy = ref(options?.defaultSort ?? ("name" as keyof T)) as Ref<
    keyof T
  >;
  const sortOrder = ref<"asc" | "desc">(options?.defaultSortOrder ?? "asc");
  const selectedIds = ref<Set<string>>(new Set());
  const currentPage = ref(1);
  const pageSize = options?.pageSize ?? 50;
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Data storage
  const allData = ref<T[]>([]) as Ref<T[]>;
  const filteredData = ref<T[]>([]) as Ref<T[]>;

  /**
   * Build the base query with filters
   */
  function buildBaseQuery() {
    let query = db.selectFrom(tableName).selectAll();

    // Apply static filters
    if (options?.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (value !== undefined && value !== null) {
          query = query.where(key as any, "=", value);
        }
      }
    }

    return query;
  }

  /**
   * Build the search query
   */
  function buildSearchQuery(baseQuery: SelectQueryBuilder<any, any, any>) {
    if (!searchQuery.value || !options?.searchFields?.length) {
      return baseQuery;
    }

    const search = searchQuery.value.toLowerCase();
    const fields = options.searchFields;

    // Build OR condition for search fields
    return baseQuery.where((eb) => {
      let condition = eb("id", "=", ""); // Always false condition to start

      for (const field of fields) {
        condition = eb.or([
          condition,
          eb(field as string, "like", `%${search}%`),
        ]);
      }

      return condition;
    });
  }

  /**
   * Build the sorted query
   */
  function buildSortedQuery(query: SelectQueryBuilder<any, any, any>) {
    return query.orderBy(
      sortBy.value as string,
      sortOrder.value === "asc" ? "asc" : "desc"
    );
  }

  /**
   * Execute the full query and update data
   */
  async function executeQuery() {
    loading.value = true;
    error.value = null;

    try {
      // Build and execute query for all data (for filtering/stats)
      let baseQuery = buildBaseQuery();
      const allResults = (await baseQuery.execute()) as T[];
      allData.value = allResults;

      // Build and execute query with search
      let searchedQuery = buildSearchQuery(baseQuery);
      let sortedQuery = buildSortedQuery(searchedQuery);
      const filteredResults = (await sortedQuery.execute()) as T[];
      filteredData.value = filteredResults;
    } catch (e: any) {
      error.value = e.message ?? "Failed to query database";
      console.error("Query error:", e);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Setup PowerSync watch for reactive updates
   */
  function setupWatch() {
    // PowerSync watch query - watches for any changes to the table
    const watchQuery = `SELECT * FROM ${tableName}${
      options?.filters
        ? " WHERE " +
          Object.entries(options.filters)
            .filter(([_, v]) => v !== undefined && v !== null)
            .map(([k, v]) => `${k} = '${v}'`)
            .join(" AND ")
        : ""
    }`;

    // Watch for changes and re-execute query
    const abortController = new AbortController();

    (async () => {
      try {
        const stream = powerSync.watch(watchQuery, [], {
          signal: abortController.signal,
        });

        for await (const _update of stream) {
          // Re-execute query when data changes
          await executeQuery();
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Watch error:", err);
        }
      }
    })();

    // Return cleanup function
    return () => abortController.abort();
  }

  // Paginated items (computed from filtered data)
  const items = computed(() => {
    const start = (currentPage.value - 1) * pageSize;
    const end = start + pageSize;
    return filteredData.value.slice(start, end);
  });

  // All filtered items (without pagination)
  const allItems = computed(() => filteredData.value);

  // Pagination info
  const totalPages = computed(() =>
    Math.ceil(filteredData.value.length / pageSize)
  );

  const hasNextPage = computed(() => currentPage.value < totalPages.value);
  const hasPreviousPage = computed(() => currentPage.value > 1);

  // Selection helpers
  const selectedCount = computed(() => selectedIds.value.size);
  const allSelected = computed(
    () =>
      items.value.length > 0 &&
      items.value.every((item: T) => selectedIds.value.has(item.id))
  );

  // Stats
  const totalCount = computed(() => allData.value.length);
  const filteredCount = computed(() => filteredData.value.length);

  // Methods
  function toggleSelection(id: string) {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id);
    } else {
      selectedIds.value.add(id);
    }
  }

  function selectAll() {
    items.value.forEach((item: T) => {
      selectedIds.value.add(item.id);
    });
  }

  function deselectAll() {
    selectedIds.value.clear();
  }

  function toggleSelectAll() {
    if (allSelected.value) {
      deselectAll();
    } else {
      selectAll();
    }
  }

  function setSortBy(field: keyof T) {
    if (sortBy.value === field) {
      // Toggle order if same field
      sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
    } else {
      sortBy.value = field;
      sortOrder.value = "asc";
    }
  }

  function nextPage() {
    if (hasNextPage.value) {
      currentPage.value++;
    }
  }

  function previousPage() {
    if (hasPreviousPage.value) {
      currentPage.value--;
    }
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
    }
  }

  function resetPagination() {
    currentPage.value = 1;
  }

  async function refresh() {
    await executeQuery();
  }

  // Watch for reactive changes
  watch([searchQuery, sortBy, sortOrder], async () => {
    await executeQuery();
    resetPagination();
  });

  // Initial query execution
  executeQuery();

  // Setup PowerSync watch
  const cleanup = setupWatch();

  // Cleanup on unmount
  onUnmounted(() => {
    cleanup();
  });

  return {
    // Display items
    items: items as any,
    allItems,

    // Search
    searchQuery,

    // Sorting
    sortBy,
    sortOrder,
    setSortBy,

    // Pagination
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    goToPage,
    resetPagination,

    // Selection
    selectedIds,
    selectedCount,
    allSelected,
    toggleSelection,
    selectAll,
    deselectAll,
    toggleSelectAll,

    // Stats
    totalCount,
    filteredCount,

    // Loading/Error
    loading,
    error,

    // Refresh
    refresh,
  };
}
