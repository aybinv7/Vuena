<template>
  <F7Sheet
    class="demo-sheet-swipe-to-close !h-auto"
    swipe-to-close
    backdrop
    :opened="opened"
    @sheet:closed="$emit('update:opened', false)"
  >
    <F7Toolbar>
      <div class="left"></div>
      <div class="right">
        <F7Link sheet-close>Done</F7Link>
      </div>
    </F7Toolbar>

    <F7BlockTitle large>Add Expense</F7BlockTitle>

    <F7List no-hairlines-md>
      <F7ListInput
        label="Description"
        type="text"
        placeholder="What was it for?"
        :value="description"
        @input="description = $event.target.value"
        clear-button
      >
        <template #media>
          <F7Icon f7="doc_text" />
        </template>
      </F7ListInput>

      <F7ListInput
        label="Amount"
        type="number"
        placeholder="0.00"
        :value="amount"
        @input="amount = $event.target.value"
      >
        <template #media>
          <F7Icon f7="money_dollar_circle" />
        </template>
      </F7ListInput>

      <F7ListInput
        label="Date"
        type="date"
        :value="date"
        @input="date = $event.target.value"
      >
        <template #media>
          <F7Icon f7="calendar" />
        </template>
      </F7ListInput>
    </F7List>

    <F7BlockTitle>Who Paid?</F7BlockTitle>
    <F7List>
      <F7ListItem
        v-for="member in groupMembers"
        :key="member.id"
        radio
        :value="member.user_id"
        name="payer"
        :checked="paidBy === member.user_id"
        :title="getMemberName(member.user_id)"
        @change="paidBy = member.user_id"
      >
        <template #media>
          <F7Icon
            f7="person_circle_fill"
            :color="paidBy === member.user_id ? 'blue' : 'gray'"
          />
        </template>
      </F7ListItem>
    </F7List>

    <F7BlockTitle>Split Between</F7BlockTitle>
    <F7List>
      <F7ListItem
        v-for="member in groupMembers"
        :key="`split-${member.id}`"
        checkbox
        :value="member.user_id"
        :checked="selectedMembers.includes(member.user_id)"
        :title="getMemberName(member.user_id)"
        @change="toggleMember(member.user_id)"
      >
        <template #media>
          <F7Icon f7="person_circle_fill" color="blue" />
        </template>
        <template
          #after
          v-if="selectedMembers.includes(member.user_id) && amount"
        >
          <span class="text-color-gray">
            {{ formatCurrency(parseFloat(amount) / selectedMembers.length) }}
          </span>
        </template>
      </F7ListItem>
    </F7List>

    <F7Block
      v-if="selectedMembers.length > 0"
      class="text-align-center text-color-gray"
    >
      <p>
        {{ selectedMembers.length }}
        {{ selectedMembers.length === 1 ? "person" : "people" }} splitting
        {{ formatCurrency(parseFloat(amount || "0")) }}
      </p>
    </F7Block>

    <F7Block>
      <F7Button
        fill
        large
        @click="save"
        :disabled="!canSave"
        :loading="loading"
      >
        Save Expense
      </F7Button>
    </F7Block>
  </F7Sheet>
</template>

<script setup lang="ts">
const { opened, groupId } = defineProps<{
  opened: boolean;
  groupId: string;
}>();

const emit = defineEmits<{
  (e: "update:opened", value: boolean): void;
}>();

const expensesStore = useExpensesStore();
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const description = ref("");
const amount = ref("");
const date = ref(new Date().toISOString().split("T")[0]);
const paidBy = ref("");
const selectedMembers = ref<string[]>([]);
const loading = ref(false);
const groupMembers = ref<any[]>([]);

const canSave = computed(() => {
  return (
    description.value &&
    amount.value &&
    paidBy.value &&
    selectedMembers.value.length > 0
  );
});

function getMemberName(userId: string) {
  if (userId === user.value?.id) return "You";
  return userId.substring(0, 8) + "...";
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function toggleMember(userId: string) {
  const index = selectedMembers.value.indexOf(userId);
  if (index > -1) {
    selectedMembers.value.splice(index, 1);
  } else {
    selectedMembers.value.push(userId);
  }
}

async function fetchGroupMembers() {
  try {
    const result = await powerSyncDatabase.execute(
      "SELECT * FROM members WHERE group_id = ?",
      [groupId]
    );
    groupMembers.value = Array.from(result.rows?._array || result.rows || []);

    // Auto-select current user as payer
    if (user.value?.id && !paidBy.value) {
      paidBy.value = user.value.id;
    }

    // Auto-select all members for split
    if (selectedMembers.value.length === 0) {
      selectedMembers.value = groupMembers.value.map((m) => m.user_id);
    }
  } catch (error) {
    console.error("Error fetching members:", error);
  }
}

async function save() {
  if (!canSave.value) return;

  loading.value = true;
  try {
    const totalAmount = parseFloat(amount.value);
    const splitAmount = totalAmount / selectedMembers.value.length;

    const splits = selectedMembers.value.map((userId) => ({
      userId,
      amount: splitAmount,
    }));

    await expensesStore.addExpense(
      groupId,
      totalAmount,
      description.value,
      splits,
      paidBy.value,
      date.value
    );

    f7.toast
      .create({
        text: "✓ Expense added!",
        position: "center",
        closeTimeout: 2000,
      })
      .open();

    // Reset form
    description.value = "";
    amount.value = "";
    date.value = new Date().toISOString().split("T")[0];
    selectedMembers.value = groupMembers.value.map((m) => m.user_id);

    emit("update:opened", false);
  } catch (e) {
    console.error(e);
    f7.dialog.alert("Error adding expense");
  } finally {
    loading.value = false;
  }
}

watch(
  () => opened,
  (isOpened) => {
    if (isOpened) {
      fetchGroupMembers();
    }
  }
);
</script>
