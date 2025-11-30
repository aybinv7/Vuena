<template>
  <F7Page no-toolbar ptr @ptr:refresh="handleRefresh">
    <F7Navbar :title="groupName" back-link="Back">
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
          class="mb-20"
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
            swipeout
            @click="viewExpenseDetails(expense)"
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
import { f7Fab } from "framework7-vue";

const props = defineProps<{
  id: string;
}>();

const groupId = computed(() => props.id);
const expensesStore = useExpensesStore();
const { expenses } = storeToRefs(expensesStore);
const groupsStore = useGroupsStore();
const { groups } = storeToRefs(groupsStore);
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const showAddExpense = ref(false);
const showAddMember = ref(false);
const members = ref<any[]>([]);
const balances = ref<any[]>([]);
const expenseSearchQuery = ref("");
const memberExpenseCounts = ref<Record<string, number>>({});
const isSearchOpen = ref(false);

const groupName = computed(() => {
  const group = groups.value.find((g) => g.id === props.id);
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

function searchExpenses(searchbar: any, query: string) {
  expenseSearchQuery.value = query;
}

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
  const result = await database.execute(
    "SELECT * FROM members WHERE group_id = ?",
    [props.id]
  );
  members.value = Array.from(result.rows?._array || result.rows || []);

  // Load expense counts per member
  const countsResult = await database.execute(
    "SELECT paid_by, COUNT(*) as count FROM expenses WHERE group_id = ? GROUP BY paid_by",
    [props.id]
  );
  const countsArray = Array.from(countsResult.rows?._array || []);
  memberExpenseCounts.value = Object.fromEntries(
    countsArray.map((row: any) => [row.paid_by, row.count])
  );
}

async function calculateBalances() {
  // Simplified - in production you'd calculate based on splits
  balances.value = [];
}

async function deleteExpense(expenseId: string) {
  await database.execute("DELETE FROM expenses WHERE id = ?", [expenseId]);
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
      await database.writeTransaction(async (tx) => {
        await tx.execute(
          "INSERT INTO settlements (id, group_id, from_user, to_user, amount, settled_at) VALUES (?, ?, ?, ?, ?, ?)",
          [
            crypto.randomUUID(),
            props.id,
            balance.from,
            balance.to,
            balance.amount,
            new Date().toISOString(),
          ]
        );
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
  await database.execute("DELETE FROM members WHERE id = ?", [memberId]);
  await loadMembers();
}

function editGroupName() {
  const currentName = groupName.value;
  f7.dialog.prompt("Group Name", currentName, async (newName) => {
    if (newName) {
      await database.execute("UPDATE groups SET name = ? WHERE id = ?", [
        newName,
        props.id,
      ]);
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
    await database.execute(
      "DELETE FROM members WHERE group_id = ? AND user_id = ?",
      [props.id, userId]
    );
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

onMounted(async () => {
  expensesStore.watchGroupExpenses(props.id);
  await loadMembers();
  await calculateBalances();
});

onUnmounted(() => {
  expensesStore.stopWatching();
});
</script>
