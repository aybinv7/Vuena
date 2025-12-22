import { useAuthStore } from "@/shared/stores/auth.store";
import { useExpensesStore } from "@/shared/stores/expenses.store";
import { useGroupsStore } from "@/shared/stores/groups.store";
import { useLanguageStore } from "@/shared/stores/useLanguage.stores";

/**
 * Configuration for OpenReplay Pinia Tracking
 * Map the Store Name to the Store Definition (useStore function)
 */
export const trackedStores: Record<string, Function> = {
  auth: useAuthStore,
  expenses: useExpensesStore,
  groups: useGroupsStore,
  language: useLanguageStore,
};
