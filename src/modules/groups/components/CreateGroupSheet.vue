<template>
  <F7Sheet
    class="!h-auto"
    swipe-to-close
    backdrop
    :opened="opened"
    @sheet:closed="$emit('update:opened', false)"
  >
    <template #fixed>
      <div class="text-xl font-bold p-4">Create New Group</div>
    </template>

    <F7List class="!my-1" no-hairlines-md>
      <F7ListInput
        label="Group Name"
        type="text"
        placeholder="e.g. Summer Trip"
        :value="name"
        @input="name = $event.target.value"
        clear-button
      />

      <f7-list-item
        title="Currency"
        smart-select
        :smart-select-params="{ openIn: 'sheet' }"
      >
        <select v-model="currency" name="currency">
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="JPY">JPY (¥)</option>
        </select>
      </f7-list-item>
    </F7List>
    <div class="!p-4">
      <F7Button fill large @click="create" :loading="loading"
        >Create Group</F7Button
      >
    </div>
  </F7Sheet>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useGroupsStore } from "@/stores/groups.store";

const props = defineProps<{
  opened: boolean;
}>();

const emit = defineEmits<{
  (e: "update:opened", value: boolean): void;
}>();

const groupsStore = useGroupsStore();
const name = ref("");
const currency = ref("USD");
const loading = ref(false);

async function create() {
  if (!name.value.trim()) return;

  loading.value = true;
  try {
    await groupsStore.createGroup(name.value, currency.value);
    name.value = "";
    emit("update:opened", false);
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}
</script>
