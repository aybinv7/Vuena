<template>
  <F7Page no-toolbar ptr @ptr:refresh="handleRefresh">
    <F7Navbar
      :title="expense?.description || 'Expense Details'"
      back-link="Back"
    >
      <F7NavRight>
        <F7Link
          icon-ios="f7:ellipsis_circle"
          icon-md="material:more_vert"
          popup-open=".popup-menu"
        />
      </F7NavRight>
    </F7Navbar>

    <!-- Options Popup -->
    <F7Popup class="popup-menu" push>
      <F7Page>
        <F7Navbar title="Expense Options">
          <F7NavRight>
            <F7Link popup-close>Close</F7Link>
          </F7NavRight>
        </F7Navbar>

        <F7List>
          <F7ListItem
            link
            popup-close
            title="Edit Expense"
            @click="editExpense"
          >
            <template #media>
              <F7Icon f7="pencil_circle_fill" color="blue" />
            </template>
          </F7ListItem>

          <F7ListItem
            link
            popup-close
            title="Delete Expense"
            text-color="red"
            @click="confirmDelete"
          >
            <template #media>
              <F7Icon f7="trash_circle_fill" color="red" />
            </template>
          </F7ListItem>
        </F7List>
      </F7Page>
    </F7Popup>

    <!-- Main Content -->
    <F7Block v-if="expense">
      <!-- Amount Card -->
      <F7Card>
        <F7CardContent class="text-align-center">
          <div class="text-color-gray margin-bottom-half">Total Amount</div>
          <div
            style="
              font-size: 48px;
              font-weight: bold;
              color: var(--f7-theme-color);
            "
          >
            {{ formatCurrency(expense.amount) }}
          </div>
        </F7CardContent>
      </F7Card>

      <!-- Expense Details -->
      <F7BlockTitle>Details</F7BlockTitle>
      <F7List media-list>
        <F7ListItem
          title="Description"
          :after="expense.description || 'No description'"
        >
          <template #media>
            <F7Icon f7="doc_text_fill" color="blue" />
          </template>
        </F7ListItem>

        <F7ListItem title="Paid by" :after="getUserName(expense.paid_by)">
          <template #media>
            <F7Icon f7="person_circle_fill" color="green" />
          </template>
        </F7ListItem>

        <F7ListItem
          title="Date"
          :after="formatDate(expense.date || expense.created_at)"
        >
          <template #media>
            <F7Icon f7="calendar_circle_fill" color="orange" />
          </template>
        </F7ListItem>

        <F7ListItem
          v-if="expense.category"
          title="Category"
          :after="expense.category"
        >
          <template #media>
            <F7Icon f7="tag_circle_fill" color="purple" />
          </template>
        </F7ListItem>
      </F7List>

      <!-- Split Information -->
      <F7BlockTitle>Split Details</F7BlockTitle>
      <F7Card>
        <F7CardContent>
          <div class="text-color-gray text-align-center">
            Split information will be displayed here
          </div>
        </F7CardContent>
      </F7Card>

      <!-- Action Buttons -->
      <F7Block>
        <div>
          <div>
            <F7Button outline color="blue" large @click="editExpense">
              <F7Icon f7="pencil" class="margin-right-half" />
              Edit
            </F7Button>
          </div>
          <div>
            <F7Button outline color="red" large @click="confirmDelete">
              <F7Icon f7="trash" class="margin-right-half" />
              Delete
            </F7Button>
          </div>
        </div>
      </F7Block>
    </F7Block>

    <!-- Loading/Error State -->
    <F7Block v-else class="text-align-center margin-top">
      <div>
        <F7Icon
          f7="exclamationmark_triangle"
          size="64"
          color="gray"
          class="margin-bottom"
        />
      </div>
      <h3>Expense not found</h3>
      <p class="text-color-gray">This expense may have been deleted</p>
      <F7Button fill large @click="goBack"> Back to Group </F7Button>
    </F7Block>
  </F7Page>
</template>

<script setup lang="ts">
const props = defineProps<{
  id: string;
  expenseId: string;
}>();

const expensesStore = useExpensesStore();
const { expenses } = storeToRefs(expensesStore);
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const expense = computed(() => {
  return expenses.value.find(
    (e) => e.group_id === props.id && e.id === props.expenseId
  );
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
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getUserName(userId: string | null) {
  if (!userId) return "Unknown";
  if (userId === user.value?.id) return "You";
  return userId.substring(0, 8) + "...";
}

function editExpense() {
  f7.dialog.alert("Edit expense feature coming soon!");
}

async function confirmDelete() {
  f7.dialog.confirm(
    "Are you sure you want to delete this expense?",
    "Delete Expense",
    async () => {
      await deleteExpense();
    }
  );
}

async function deleteExpense() {
  try {
    await database.execute("DELETE FROM expenses WHERE id = ?", [
      props.expenseId,
    ]);
    f7.toast
      .create({
        text: "✓ Expense deleted",
        position: "center",
        closeTimeout: 2000,
      })
      .open();

    // Navigate back to group detail
    setTimeout(() => {
      goBack();
    }, 500);
  } catch (error) {
    console.error("Error deleting expense:", error);
    f7.toast
      .create({
        text: "Failed to delete expense",
        position: "center",
        closeTimeout: 2000,
      })
      .open();
  }
}

function goBack() {
  f7.views.main.router.navigate(`/group/${props.id}`);
}

async function handleRefresh(done: any) {
  // Refresh expense data
  await expensesStore.watchGroupExpenses(props.id);
  setTimeout(() => {
    done();
  }, 1000);
}

onMounted(async () => {
  // Ensure we're watching the group expenses
  expensesStore.watchGroupExpenses(props.id);
});

onUnmounted(() => {
  expensesStore.stopWatching();
});
</script>
