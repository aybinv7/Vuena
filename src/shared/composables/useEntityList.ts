import { ref, computed, watch, type Ref, type ComputedRef } from "vue";
import type { BaseEntity } from "@/shared/database/base";

/**
 * Return type for useEntityList composable
 */
export interface UseEntityListReturn<T extends BaseEntity> {
  // Display items
  items: ComputedRef<T[]>;
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
}

/**
 * Reusable composable for managing entity lists
 *
 * Provides common functionality for list views:
 * - Filtering/searching
 * - Sorting
 * - Pagination
 * - Selection
 *
 * @example
 * ```typescript
 * const {
 *   items,
 *   searchQuery,
 *   sortBy,
 *   selectedIds,
 *   toggleSelection
 * } = useEntityList(contacts, {
 *   searchFields: ['name', 'email'],
 *   defaultSort: 'name'
 * });
 * ```
 */
export function useEntityList<T extends BaseEntity>(
  source: Ref<T[]>,
  options?: {
    searchFields?: (keyof T)[];
    defaultSort?: keyof T;
    defaultSortOrder?: "asc" | "desc";
    pageSize?: number;
  }
): UseEntityListReturn<T> {
  const searchQuery = ref("");
  const sortBy = ref(options?.defaultSort ?? ("name" as keyof T)) as Ref<
    keyof T
  >;
  const sortOrder = ref<"asc" | "desc">(options?.defaultSortOrder ?? "asc");
  const selectedIds = ref<Set<string>>(new Set());
  const currentPage = ref(1);
  const pageSize = options?.pageSize ?? 50;

  // Filtered items based on search query
  const filteredItems = computed(() => {
    if (!searchQuery.value) return source.value;

    const query = searchQuery.value.toLowerCase();
    const fields = options?.searchFields ?? (["name"] as (keyof T)[]);

    return source.value.filter((item) => {
      return fields.some((field) => {
        const value = item[field];
        if (typeof value === "string") {
          return value.toLowerCase().includes(query);
        }
        return false;
      });
    });
  });

  // Sorted items
  const sortedItems = computed(() => {
    const items = [...filteredItems.value];

    items.sort((a, b) => {
      const aVal = a[sortBy.value as keyof T];
      const bVal = b[sortBy.value as keyof T];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Compare values
      let comparison = 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortOrder.value === "asc" ? comparison : -comparison;
    });

    return items;
  });

  // Paginated items
  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize;
    const end = start + pageSize;
    return sortedItems.value.slice(start, end);
  });

  // Pagination info
  const totalPages = computed(() =>
    Math.ceil(sortedItems.value.length / pageSize)
  );

  const hasNextPage = computed(() => currentPage.value < totalPages.value);
  const hasPreviousPage = computed(() => currentPage.value > 1);

  // Selection helpers
  const selectedCount = computed(() => selectedIds.value.size);
  const allSelected = computed(
    () =>
      paginatedItems.value.length > 0 &&
      paginatedItems.value.every((item: T) => selectedIds.value.has(item.id))
  );

  function toggleSelection(id: string) {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id);
    } else {
      selectedIds.value.add(id);
    }
  }

  function selectAll() {
    paginatedItems.value.forEach((item: T) => {
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

  // Watch search query and reset pagination
  watch(searchQuery, resetPagination);

  return {
    // Display items
    items: paginatedItems,
    allItems: sortedItems,

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
    totalCount: computed(() => sortedItems.value.length),
    filteredCount: computed(() => filteredItems.value.length),
  };
}
