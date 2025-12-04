<template>
  <F7Page>
    <F7Navbar back-link="Back" title="Examples" />

    <F7Block>
      <h1>Architecture Examples</h1>
      <p class="text-color-gray">
        Interactive examples demonstrating the composables and architecture
      </p>
    </F7Block>

    <!-- Composables Section -->
    <F7BlockTitle>Composables</F7BlockTitle>
    <F7List inset>
      <F7ListItem
        link="/examples/kysely-query"
        title="useKyselyQuery"
        subtitle="Reactive database queries with PowerSync"
        chevron
      >
        <template #media>
          <F7Icon f7="layers_alt" color="blue" />
        </template>
      </F7ListItem>

      <F7ListItem
        link="/examples/entity-form"
        title="useEntity + useForm"
        subtitle="CRUD operations with form validation"
        chevron
      >
        <template #media>
          <F7Icon f7="square_pencil" color="green" />
        </template>
      </F7ListItem>
    </F7List>

    <!-- Quick Actions -->
    <F7BlockTitle>Quick Actions</F7BlockTitle>
    <F7List inset>
      <F7ListItem
        link="#"
        title="Create Sample Tasks"
        @click="createSampleData"
      >
        <template #media>
          <F7Icon f7="plus_circle_fill" color="green" />
        </template>
      </F7ListItem>

      <F7ListItem link="#" title="Clear All Tasks" @click="clearAllData">
        <template #media>
          <F7Icon f7="trash" color="red" />
        </template>
      </F7ListItem>
    </F7List>
  </F7Page>
</template>

<script setup lang="ts">
import { taskModel } from "../models/TaskModel";

async function createSampleData() {
  try {
    const sampleTasks = [
      {
        title: "Setup PowerSync",
        description: "Configure PowerSync with Supabase backend",
        status: "completed" as const,
        priority: "high" as const,
      },
      {
        title: "Create BaseModel",
        description: "Implement base model with Kysely",
        status: "completed" as const,
        priority: "high" as const,
      },
      {
        title: "Build composables",
        description: "Create reusable Vue composables for common patterns",
        status: "in_progress" as const,
        priority: "medium" as const,
      },
      {
        title: "Write documentation",
        description: "Document the architecture and patterns",
        status: "pending" as const,
        priority: "low" as const,
      },
      {
        title: "Add unit tests",
        description: "Test composables and models",
        status: "pending" as const,
        priority: "medium" as const,
      },
    ];

    await Promise.all(sampleTasks.map((task) => taskModel.create(task)));

    f7.toast
      .create({
        text: `✓ Created ${sampleTasks.length} sample tasks`,
        position: "center",
        closeTimeout: 2000,
      })
      .open();
  } catch (error) {
    console.error("Error creating sample data:", error);
    f7.dialog.alert("Failed to create sample data");
  }
}

async function clearAllData() {
  f7.dialog.confirm("Delete all tasks?", async () => {
    try {
      const tasks = await taskModel.findAll();
      await Promise.all(tasks.map((task) => taskModel.delete(task.id)));

      f7.toast
        .create({
          text: "✓ All tasks deleted",
          position: "center",
          closeTimeout: 2000,
        })
        .open();
    } catch (error) {
      console.error("Error clearing data:", error);
      f7.dialog.alert("Failed to clear data");
    }
  });
}
</script>
