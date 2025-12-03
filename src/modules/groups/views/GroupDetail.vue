<template>
  <F7Page no-toolbar ptr @ptr:refresh="handleRefresh">
    <F7Navbar v-if="!isSelectionMode" :title="groupName" back-link="Back">
      <F7NavRight>
        <F7Link
          icon-ios="f7:search"
          icon-md="material:search"
          @click="isSearchOpen = !isSearchOpen"
        />
        <F7Link
          icon-ios="f7:ellipsis_circle"
          icon-md="material:more_vert"
          popup-open=".popup-menu"
        />
      </F7NavRight>
    </F7Navbar>

    <F7Navbar v-else :title="`${selectedExpenseIds.size} Selected`">
      <F7NavLeft>
        <F7Link icon-f7="xmark" @click="exitSelectionMode" />
      </F7NavLeft>
      <F7NavRight>
        <F7Link
          icon-f7="trash"
          color="red"
          @click="deleteSelectedExpenses"
          v-if="selectedExpenseIds.size > 0"
        />
      </F7NavRight>
    </F7Navbar>

    <!-- <F7Searchbar
      v-if="isSearchOpen"
      :custom-search="true"
      placeholder="Search expenses..."
      :clear-button="true"
      @searchbar:search="searchExpenses"
      @searchbar:clear="expenseSearchQuery = ''"
    /> -->
    <F7Toolbar tabbar top>
      <F7Link
        tab-link="#tab-expenses"
        tab-link-active
        icon-ios="f7:money_dollar_circle"
        icon-md="material:attach_money"
        ripple-color="transparent"
      />
      <F7Link
        tab-link="#tab-balances"
        icon-ios="f7:chart_pie"
        icon-md="material:pie_chart"
        ripple-color="transparent"
      />
      <F7Link
        tab-link="#tab-members"
        icon-ios="f7:person_3"
        icon-md="material:people"
        ripple-color="transparent"
      />
    </F7Toolbar>

    <F7Popup class="popup-menu" push>
      <F7Page>
        <F7Navbar title="Group Options">
          <F7NavRight>
            <F7Link popup-close>Close</F7Link>
          </F7NavRight>
        </F7Navbar>

        <F7List>
          <F7ListItem
            link
            popup-close
            title="Add Member"
            @click="showAddMember = true"
          >
            <template #media>
              <F7Icon f7="person_badge_plus_fill" color="blue" />
            </template>
          </F7ListItem>

          <F7ListItem
            link
            popup-close
            title="Edit Group"
            @click="editGroupName"
          >
            <template #media>
              <F7Icon f7="pencil_circle_fill" color="orange" />
            </template>
          </F7ListItem>

          <F7ListItem
            link
            popup-close
            title="Export to CSV"
            @click="exportExpenses"
          >
            <template #media>
              <F7Icon f7="arrow_down_doc_fill" color="green" />
            </template>
          </F7ListItem>

          <F7ListItem link popup-close title="Group Settings">
            <template #media>
              <F7Icon f7="gear_alt_fill" color="gray" />
            </template>
          </F7ListItem>

          <F7ListItem
            link
            popup-close
            title="Leave Group"
            text-color="red"
            @click="leaveGroup"
          >
            <template #media>
              <F7Icon f7="arrow_right_square_fill" color="red" />
            </template>
          </F7ListItem>
        </F7List>
      </F7Page>
    </F7Popup>

    <F7Tabs animated swipeable>
      <!-- Expenses Tab -->
      <F7Tab id="tab-expenses" tab-active>
        <F7Fab
          position="right-bottom"
          color="primary"
          @click="showAddExpense = true"
        >
          <F7Icon f7="plus" />
        </F7Fab>
        <F7List
          v-if="filteredExpenses.length > 0"
          media-list
          virtual-list
          :virtual-list-params="{ items: filteredExpenses, height: 76 }"
        >
          <F7ListItem
            v-for="expense in filteredExpenses"
            :key="expense.id"
            :title="expense.description || 'No description'"
            :after="formatCurrency(expense.amount)"
            :checkbox="isSelectionMode"
            :checked="selectedExpenseIds.has(expense.id)"
            :swipeout="!isSelectionMode"
            @click="handleExpenseClick(expense)"
            @taphold="onExpenseHold(expense)"
            @swipeout:deleted="deleteExpense(expense.id)"
          >
            <template #subtitle>
              <div class="display-flex align-items-center gap-half">
                <F7Icon
                  :f7="
                    expense.paid_by === user?.id
                      ? 'arrow_up_circle_fill'
                      : 'arrow_down_circle_fill'
                  "
                  :color="expense.paid_by === user?.id ? 'green' : 'orange'"
                  size="16"
                />
                <span>{{
                  expense.paid_by === user?.id
                    ? "You paid"
                    : getUserName(expense.paid_by)
                }}</span>
              </div>
            </template>
            <!-- <template #text>
              <F7Chip
                :text="expense.category || 'general'"
                color="blue"
                class="margin-right-half"
              />
              {{ formatDate(expense.date || expense.created_at) }}
            </template> -->

            <F7SwipeoutActions right>
              <F7SwipeoutButton color="blue" @click="editExpense(expense)">
                Edit
              </F7SwipeoutButton>
              <F7SwipeoutButton delete confirm-text="Delete this expense?">
                Delete
              </F7SwipeoutButton>
            </F7SwipeoutActions>
          </F7ListItem>
        </F7List>

        <F7Block v-else class="text-align-center margin-top">
          <div>
            <F7Icon f7="tray" size="64" color="gray" class="margin-bottom" />
          </div>
          <h3>
            {{ expenseSearchQuery ? "No expenses found" : "No expenses yet" }}
          </h3>
          <p class="text-color-gray">
            {{
              expenseSearchQuery
                ? "Try a different search"
                : "Add your first expense"
            }}
          </p>
          <F7Button
            v-if="!expenseSearchQuery"
            fill
            large
            @click="showAddExpense = true"
          >
            Add Expense
          </F7Button>
        </F7Block>
      </F7Tab>

      <!-- Balances Tab -->
      <F7Tab id="tab-balances">
        <!-- Summary Card -->
        <F7Card
          v-if="balancesSummary.youOwe > 0 || balancesSummary.youAreOwed > 0"
        >
          <F7CardContent>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-align-center">
                <div
                  class="text-color-red"
                  style="font-size: 24px; font-weight: bold"
                >
                  {{ formatCurrency(balancesSummary.youOwe) }}
                </div>
                <div class="text-color-gray">You owe</div>
              </div>
              <div class="text-align-center">
                <div
                  class="text-color-green"
                  style="font-size: 24px; font-weight: bold"
                >
                  {{ formatCurrency(balancesSummary.youAreOwed) }}
                </div>
                <div class="text-color-gray">You are owed</div>
              </div>
            </div>
          </F7CardContent>
        </F7Card>

        <F7BlockTitle>Balances</F7BlockTitle>

        <F7List v-if="balances.length > 0">
          <F7ListItem
            v-for="balance in balances"
            :key="`${balance.from}-${balance.to}`"
            :title="balance.fromName"
            :subtitle="`owes ${balance.toName}`"
            :after="formatCurrency(balance.amount)"
            swipeout
            @taphold="onBalanceHold(balance)"
          >
            <template #media>
              <F7Icon
                :f7="
                  balance.from === user?.id
                    ? 'arrow_up_right_circle_fill'
                    : 'arrow_down_left_circle_fill'
                "
                :color="balance.from === user?.id ? 'red' : 'green'"
                size="32"
              />
            </template>

            <F7SwipeoutActions right>
              <F7SwipeoutButton color="green" @click="settleDebt(balance)">
                Settle
              </F7SwipeoutButton>
            </F7SwipeoutActions>
          </F7ListItem>
        </F7List>

        <F7Block v-else class="text-align-center margin-top">
          <div class="animate-pulse">
            <F7Icon
              f7="checkmark_seal_fill"
              size="64"
              color="green"
              class="margin-bottom"
            />
          </div>
          <h3>All settled up!</h3>
          <p class="text-color-gray">No outstanding balances</p>
        </F7Block>
      </F7Tab>

      <!-- Members Tab -->
      <F7Tab id="tab-members">
        <F7BlockTitle>Members ({{ members.length }})</F7BlockTitle>

        <F7List media-list>
          <F7ListItem
            v-for="member in members"
            :key="member.id"
            :title="getMemberName(member.user_id)"
            :subtitle="`Joined ${formatDate(member.joined_at)}`"
            :badge="member.user_id === user?.id ? 'You' : ''"
            badge-color="blue"
            swipeout
            @taphold="onMemberHold(member)"
            @swipeout:deleted="removeMember(member.id)"
          >
            <template #media>
              <div
                :class="`w-12 h-12 rounded-full flex items-center justify-center ${
                  member.user_id === user?.id ? 'bg-blue-100' : 'bg-gray-100'
                }`"
              >
                <F7Icon
                  f7="person_fill"
                  :color="member.user_id === user?.id ? 'blue' : 'gray'"
                  size="24"
                />
              </div>
            </template>

            <template #after>
              <F7Badge
                :color="
                  getMemberExpenseCount(member.user_id) > 0 ? 'green' : 'gray'
                "
              >
                {{ getMemberExpenseCount(member.user_id) }}
              </F7Badge>
            </template>

            <F7SwipeoutActions v-if="member.user_id !== user?.id" right>
              <F7SwipeoutButton delete confirm-text="Remove this member?">
                Remove
              </F7SwipeoutButton>
            </F7SwipeoutActions>
          </F7ListItem>
        </F7List>

        <F7Block>
          <F7Button
            outline
            large
            icon-f7="person_badge_plus"
            @click="showAddMember = true"
          >
            Add Member
          </F7Button>
        </F7Block>
      </F7Tab>
    </F7Tabs>

    <AddExpenseSheet v-model:opened="showAddExpense" :group-id="groupId" />
  </F7Page>
</template>

<script setup lang="ts">
const { id } = defineProps<{
  id: string;
}>();

const groupId = computed(() => id);
const expensesStore = useExpensesStore();
const { expenses } = storeToRefs(expensesStore);
const groupsStore = useGroupsStore();
const { groups } = storeToRefs(groupsStore);
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
import { db } from "@/shared/database";

const showAddExpense = ref(false);
const showAddMember = ref(false);
const members = ref<any[]>([]);
const balances = ref<any[]>([]);
const expenseSearchQuery = ref("");
const memberExpenseCounts = ref<Record<string, number>>({});
const isSearchOpen = ref(false);

// Selection Mode State
const isSelectionMode = ref(false);
const selectedExpenseIds = ref<Set<string>>(new Set());

const groupName = computed(() => {
  const group = groups.value.find((g) => g.id === id);
  return group?.name || "Group";
});

const filteredExpenses = computed(() => {
  if (!expenseSearchQuery.value) return expenses.value;
  const query = expenseSearchQuery.value.toLowerCase();
  return expenses.value.filter(
    (e) =>
      e.description?.toLowerCase().includes(query) ||
      e.category?.toLowerCase().includes(query)
  );
});

const balancesSummary = computed(() => {
  let youOwe = 0;
  let youAreOwed = 0;

  balances.value.forEach((b) => {
    if (b.from === user.value?.id) {
      youOwe += b.amount;
    } else if (b.to === user.value?.id) {
      youAreOwed += b.amount;
    }
  });

  return { youOwe, youAreOwed };
});

function formatCurrency(amount: number | null) {
  if (amount === null || amount === undefined) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getMemberName(userId: string) {
  if (userId === user.value?.id) return "You";
  return userId.substring(0, 8) + "...";
}

function getUserName(userId: string | null) {
  if (!userId) return "Someone";
  if (userId === user.value?.id) return "You";
  return "Member";
}

function getMemberExpenseCount(userId: string): number {
  return memberExpenseCounts.value[userId] || 0;
}

async function loadMembers() {
  const result = await db
    .selectFrom("members")
    .selectAll()
    .where("group_id", "=", id)
    .execute();
  members.value = result;

  // Load expense counts per member
  const countsResult = await db
    .selectFrom("expenses")
    .select((eb) => ["paid_by", eb.fn.countAll().as("count")])
    .where("group_id", "=", id)
    .groupBy("paid_by")
    .execute();

  memberExpenseCounts.value = Object.fromEntries(
    countsResult.map((row) => [row.paid_by, Number(row.count)])
  );
}

async function calculateBalances() {
  // Simplified - in production you'd calculate based on splits
  balances.value = [];
}

async function deleteExpense(expenseId: string) {
  await db.deleteFrom("expenses").where("id", "=", expenseId).execute();
  f7.toast
    .create({
      text: "✓ Expense deleted",
      position: "center",
      closeTimeout: 2000,
    })
    .open();
}

function editExpense(expense: any) {
  f7.dialog.alert("Edit expense feature coming soon!");
}

function goToGroupExpenses(expenseId: string) {
  f7.views.main.router.navigate(`/group/${id}/${expenseId}`, {
    animate: true,
    transition: "f7-parallax",
  });
}

function viewExpenseDetails(expense: any) {
  f7.sheet
    .create({
      content: `
      <div class="sheet-modal" style="height:auto">
        <div class="sheet-modal-inner">
          <div class="page-content">
            <div class="block-title">Expense Details</div>
            <div class="list">
              <ul>
                <li class="item-content">
                  <div class="item-inner">
                    <div class="item-title">Description</div>
                    <div class="item-after">${expense.description}</div>
                  </div>
                </li>
                <li class="item-content">
                  <div class="item-inner">
                    <div class="item-title">Amount</div>
                    <div class="item-after">${formatCurrency(
                      expense.amount
                    )}</div>
                  </div>
                </li>
                <li class="item-content">
                  <div class="item-inner">
                    <div class="item-title">Date</div>
                    <div class="item-after">${formatDate(expense.date)}</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `,
      swipeToClose: true,
      backdrop: true,
    })
    .open();
}

async function settleDebt(balance: any) {
  f7.dialog.confirm(
    `Mark ${formatCurrency(balance.amount)} as settled?`,
    async () => {
      await db.transaction().execute(async (tx) => {
        await tx
          .insertInto("settlements")
          .values({
            id: crypto.randomUUID(),
            group_id: id,
            payer_id: balance.from,
            receiver_id: balance.to,
            amount: balance.amount,
            date: new Date().toISOString(),
          })
          .execute();
      });
      f7.toast
        .create({
          text: "✓ Debt settled!",
          position: "center",
          closeTimeout: 2000,
        })
        .open();
      await calculateBalances();
    }
  );
}

async function removeMember(memberId: string) {
  await db.deleteFrom("members").where("id", "=", memberId).execute();
  await loadMembers();
}

function editGroupName() {
  const currentName = groupName.value;
  f7.dialog.prompt("Group Name", currentName, async (newName) => {
    if (newName) {
      await db
        .updateTable("groups")
        .set({ name: newName })
        .where("id", "=", id)
        .execute();
      f7.toast
        .create({
          text: "✓ Group renamed!",
          position: "center",
          closeTimeout: 2000,
        })
        .open();
    }
  });
}

function exportExpenses() {
  f7.toast
    .create({
      text: "Export feature coming soon!",
      position: "center",
      closeTimeout: 2000,
    })
    .open();
}

function leaveGroup() {
  f7.dialog.confirm("Are you sure you want to leave this group?", async () => {
    const userId = user.value?.id;
    await db
      .deleteFrom("members")
      .where("group_id", "=", id)
      .where("user_id", "=", userId!)
      .execute();
    f7.view.main.router.back();
  });
}

async function handleRefresh(done: any) {
  await loadMembers();
  await calculateBalances();
  setTimeout(() => {
    console.log("Refreshed", done);
    done();
  }, 1000);
}

function onExpenseHold(expense: any) {
  if (!isSelectionMode.value) {
    isSelectionMode.value = true;
    selectedExpenseIds.value.add(expense.id);
    // Vibrate to indicate selection mode started
    if (navigator.vibrate) navigator.vibrate(50);
  }
}

function handleExpenseClick(expense: any) {
  if (isSelectionMode.value) {
    toggleExpenseSelection(expense.id);
  } else {
    goToGroupExpenses(expense.id);
  }
}

function toggleExpenseSelection(id: string) {
  if (selectedExpenseIds.value.has(id)) {
    selectedExpenseIds.value.delete(id);
    if (selectedExpenseIds.value.size === 0) {
      isSelectionMode.value = false;
    }
  } else {
    selectedExpenseIds.value.add(id);
  }
}

function exitSelectionMode() {
  isSelectionMode.value = false;
  selectedExpenseIds.value.clear();
}

async function deleteSelectedExpenses() {
  f7.dialog.confirm(
    `Delete ${selectedExpenseIds.value.size} expenses?`,
    async () => {
      const ids = Array.from(selectedExpenseIds.value);
      try {
        await db.deleteFrom("expenses").where("id", "in", ids).execute();
        f7.toast
          .create({
            text: "✓ Expenses deleted",
            position: "center",
            closeTimeout: 2000,
          })
          .open();
        exitSelectionMode();
      } catch (error) {
        console.error("Error deleting expenses:", error);
        f7.dialog.alert("Failed to delete expenses");
      }
    }
  );
}

function onBalanceHold(balance: any) {
  f7.dialog
    .create({
      title: "Balance Options",
      text: `${balance.fromName} owes ${balance.toName} ${formatCurrency(
        balance.amount
      )}`,
      buttons: [
        {
          text: "Settle Debt",
          color: "green",
          onClick: () => settleDebt(balance),
        },
        {
          text: "Cancel",
          color: "gray",
        },
      ],
    })
    .open();
}

function onMemberHold(member: any) {
  if (member.user_id === user.value?.id) return;

  f7.dialog
    .create({
      title: "Member Options",
      text: getMemberName(member.user_id),
      buttons: [
        {
          text: "Remove Member",
          color: "red",
          onClick: () => {
            f7.dialog.confirm("Remove this member?", () =>
              removeMember(member.id)
            );
          },
        },
        {
          text: "Cancel",
          color: "gray",
        },
      ],
    })
    .open();
}

onMounted(async () => {
  expensesStore.watchGroupExpenses(id);
  await loadMembers();
  await calculateBalances();
});

onUnmounted(() => {
  expensesStore.stopWatching();
});
</script>
