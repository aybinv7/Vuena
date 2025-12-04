<template>
  <F7Page>
    <F7Navbar title="useEntity + useForm Example" back-link="Back" />

    <F7Block>
      <h2>Entity CRUD with Form Validation</h2>
      <p class="text-color-gray">
        Demonstrates <code>useEntity</code> for CRUD operations and
        <code>useForm</code> for validation.
      </p>
    </F7Block>

    <!-- Loading State -->
    <F7Block v-if="loading || saving" class="text-align-center">
      <F7Preloader />
      <p>{{ loading ? "Loading..." : "Saving..." }}</p>
    </F7Block>

    <!-- Form -->
    <F7List inset v-else>
      <F7ListInput
        label="Task Title"
        type="text"
        placeholder="Enter task title"
        :value="form.title"
        @input="
          setValue('title', $event.target.value);
          touch('title');
        "
        :error-message="errors.title"
        :error-message-force="touched.title && !!errors.title"
        clear-button
      />

      <F7ListInput
        label="Description"
        type="textarea"
        placeholder="Enter description (optional)"
        :value="form.description"
        @input="
          setValue('description', ($event.target as HTMLTextAreaElement)?.value)
        "
        clear-button
      />

      <F7ListItem
        title="Status"
        smart-select
        :smart-select-params="{ openIn: 'popover' }"
      >
        <select
          :value="form.status"
          @change="setValue('status', ($event.target as any)?.value)"
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </F7ListItem>

      <F7ListItem
        title="Priority"
        smart-select
        :smart-select-params="{ openIn: 'popover' }"
      >
        <select
          :value="form.priority"
          @change="setValue('priority', ($event.target as any)?.value)"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </F7ListItem>

      <F7ListInput
        label="Due Date"
        type="date"
        :value="form.due_date"
        @input="setValue('due_date', $event.target.value)"
      />
    </F7List>

    <!-- Form Status -->
    <F7Block>
      <F7Chip
        :color="isDirty ? 'orange' : 'gray'"
        :text="isDirty ? 'Unsaved Changes' : 'No Changes'"
      />
      <F7Chip
        :color="isValid ? 'green' : 'red'"
        :text="isValid ? 'Valid' : 'Invalid'"
      />
    </F7Block>

    <!-- Actions -->
    <F7Block>
      <F7Button fill large @click="handleSave" :disabled="!isValid || saving">
        {{ entity ? "Update Task" : "Create Task" }}
      </F7Button>
      <F7Button fill color="gray" @click="handleReset" v-if="isDirty">
        Reset Changes
      </F7Button>
      <F7Button fill color="red" @click="handleDelete" v-if="entity">
        Delete Task
      </F7Button>
    </F7Block>

    <!-- Error Display -->
    <F7Block v-if="error" class="text-color-red">
      <strong>Error:</strong> {{ error }}
    </F7Block>

    <!-- Current Entity Display -->
    <F7BlockTitle v-if="entity">Current Entity Data</F7BlockTitle>
    <F7Block v-if="entity">
      <pre
        class="bg-color-gray padding"
        style="border-radius: 8px; overflow: auto"
        >{{ JSON.stringify(entity, null, 2) }}</pre
      >
    </F7Block>
  </F7Page>
</template>

<script setup lang="ts">
import { useEntity } from "@/shared/composables";
import { useForm } from "@/shared/composables";
import { taskModel } from "@/modules/examples/models/TaskModel";
import type { Task } from "@/modules/examples/types";
import type { EntityCreate } from "@/shared/database/base";
import { f7 } from "framework7-vue";

// Get route params from Framework7
const taskId = f7.views.main.router.currentRoute?.params?.id as
  | string
  | undefined;

// useEntity composable for CRUD operations
const {
  entity,
  loading,
  saving,
  deleting,
  error,
  createEntity,
  updateEntity,
  deleteEntity,
} = useEntity<Task>(
  {
    create: (data) => taskModel.create(data as EntityCreate<Task>),
    update: (id, data) => taskModel.update(id, data),
    delete: (id) => taskModel.delete(id),
    fetchById: taskId ? (id) => taskModel.findById(id) : undefined,
  },
  taskId
);

// useForm composable for form validation
const {
  form,
  errors,
  touched,
  isDirty,
  isValid,
  validate,
  setValue,
  touch,
  reset: resetForm,
  setValues,
} = useForm<Partial<Task>>(
  {
    title: "",
    description: "",
    status: "pending" as const,
    priority: "medium" as const,
    due_date: "",
  },
  {
    title: [
      {
        validator: (v) => !!v && v.length > 0,
        message: "Title is required",
      },
      {
        validator: (v) => v.length <= 100,
        message: "Title must be less than 100 characters",
      },
    ],
  }
);

// Sync entity data to form when loaded
watch(entity, (newEntity) => {
  if (newEntity) {
    setValues({
      title: newEntity.title,
      description: newEntity.description,
      status: newEntity.status,
      priority: newEntity.priority,
      due_date: newEntity.due_date,
    });
  }
});

async function handleSave() {
  if (!validate()) {
    f7.toast
      .create({
        text: "Please fix validation errors",
        position: "center",
        closeTimeout: 2000,
      })
      .open();
    return;
  }

  try {
    if (taskId) {
      // Update existing
      await updateEntity(taskId, form as any);
      f7.toast
        .create({
          text: "✓ Task updated",
          position: "center",
          closeTimeout: 2000,
        })
        .open();
    } else {
      // Create new
      await createEntity(form as any);
      f7.toast
        .create({
          text: "✓ Task created",
          position: "center",
          closeTimeout: 2000,
        })
        .open();
      f7.views.main.router.back();
    }
  } catch (err) {
    console.error("Save error:", err);
  }
}

function handleReset() {
  resetForm();
  if (entity.value) {
    setValues({
      title: entity.value.title,
      description: entity.value.description,
      status: entity.value.status,
      priority: entity.value.priority,
      due_date: entity.value.due_date,
    });
  }
}

async function handleDelete() {
  if (!taskId) return;

  f7.dialog.confirm("Are you sure you want to delete this task?", async () => {
    try {
      await deleteEntity(taskId);
      f7.toast
        .create({
          text: "✓ Task deleted",
          position: "center",
          closeTimeout: 2000,
        })
        .open();
      f7.views.main.router.back();
    } catch (err) {
      console.error("Delete error:", err);
    }
  });
}
</script>
