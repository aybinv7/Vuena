import { defineStore } from "pinia";
import { ref } from "vue";
import { db } from "@/shared/database/index";
import type { ExpenseRecord } from "@/shared/database/types";
import { useAuthStore } from "./auth.store";

export const useExpensesStore = defineStore("expenses", () => {
  const expenses = ref<ExpenseRecord[]>([]);
  const loading = ref(false);
  const authStore = useAuthStore();

  let watchSubscription: { dispose: () => void } | null = null;

  async function watchGroupExpenses(groupId: string) {
    if (watchSubscription) {
      watchSubscription.dispose();
      watchSubscription = null;
    }

    try {
      const query = db
        .selectFrom("expenses")
        .selectAll()
        .where("group_id", "=", groupId)
        .orderBy("date", "desc")
        .orderBy("created_at", "desc");

      // @ts-ignore - db.watch is added by wrapPowerSyncWithKysely
      watchSubscription = db.watch(query, {
        onResult: (result) => {
          expenses.value = result as ExpenseRecord[];
        },
      });
    } catch (error: any) {
      console.error("Error watching expenses:", error);
    }
  }

  async function addExpense(
    groupId: string,
    amount: number,
    description: string,
    splitsData: { userId: string; amount: number }[],
    paidBy?: string,
    date?: string
  ) {
    if (!authStore.user) throw new Error("User must be logged in");

    const expenseId = crypto.randomUUID();
    const now = new Date().toISOString();
    const userId = paidBy || authStore.user.id;
    const expenseDate = date || now;

    await db.transaction().execute(async (tx) => {
      // 1. Create Expense
      await tx
        .insertInto("expenses")
        .values({
          id: expenseId,
          group_id: groupId,
          paid_by: userId,
          amount,
          description,
          category: "general",
          date: expenseDate,
          created_at: now,
        })
        .execute();

      // 2. Create Splits
      if (splitsData.length > 0) {
        await tx
          .insertInto("splits")
          .values(
            splitsData.map((split) => ({
              id: crypto.randomUUID(),
              expense_id: expenseId,
              user_id: split.userId,
              amount_owed: split.amount,
              group_id: groupId,
            }))
          )
          .execute();
      }
    });
  }

  async function settleUp(groupId: string, receiverId: string, amount: number) {
    if (!authStore.user) throw new Error("User must be logged in");

    const settlementId = crypto.randomUUID();
    const now = new Date().toISOString();
    const payerId = authStore.user.id;

    await db
      .insertInto("settlements")
      .values({
        id: settlementId,
        group_id: groupId,
        payer_id: payerId,
        receiver_id: receiverId,
        amount,
        date: now,
      })
      .execute();
  }

  function stopWatching() {
    if (watchSubscription) {
      watchSubscription.dispose();
      watchSubscription = null;
    }
  }

  return {
    expenses,
    loading,
    watchGroupExpenses,
    addExpense,
    settleUp,
    stopWatching,
  };
});
