<template>
  <F7Page>
    <F7Navbar title="About Vuena" />

    <F7Block>
      <h1>Vuena ERP Template</h1>
      <p class="text-color-gray">
        A scalable, modular ERP template built with Vue 3, Framework7,
        PowerSync, and Kysely ORM.
      </p>
    </F7Block>

    <!-- Architecture Overview -->
    <F7BlockTitle>Architecture</F7BlockTitle>
    <F7List inset>
      <F7ListItem header="PowerSync" title="Offline-First Database">
        <template #after>
          <F7Badge :color="authStore.syncConnected ? 'green' : 'gray'">
            {{ authStore.syncConnected ? "Syncing" : "Offline" }}
          </F7Badge>
        </template>
      </F7ListItem>
      <F7ListItem header="Kysely" title="Type-Safe SQL Query Builder">
        <template #after>
          <F7Badge color="green">ORM</F7Badge>
        </template>
      </F7ListItem>
      <F7ListItem header="Vue 3" title="Composition API & Reactive">
        <template #after>
          <F7Badge color="purple">UI</F7Badge>
        </template>
      </F7ListItem>
      <F7ListItem header="Framework7" title="Mobile-First Components">
        <template #after>
          <F7Badge color="orange">Mobile</F7Badge>
        </template>
      </F7ListItem>
    </F7List>

    <!-- Composables Documentation -->
    <F7BlockTitle>Shared Composables</F7BlockTitle>
    <F7List accordion-list inset>
      <!-- useKyselyQuery -->
      <F7ListItem accordion-item title="useKyselyQuery">
        <template #media>
          <F7Icon f7="layers_alt_fill" color="blue" />
        </template>
        <F7AccordionContent>
          <F7Block>
            <h4>Reactive Kysely Database Queries</h4>
            <p class="text-color-gray">
              Provides SQL-level filtering, sorting, pagination with PowerSync's
              watch API for real-time updates.
            </p>
            <pre
              class="bg-color-gray padding"
              style="border-radius: 8px; font-size: 12px; overflow-x: auto"
            >
const { 
  items, 
  searchQuery,
  sortBy,
  selectedIds,
  refresh 
} = useKyselyQuery(db, 'tasks', {
  searchFields: ['title', 'description'],
  defaultSort: 'created_at',
  pageSize: 20
});</pre
            >
            <F7Button small fill href="/examples/kysely-query"
              >View Example</F7Button
            >
          </F7Block>
        </F7AccordionContent>
      </F7ListItem>

      <!-- useEntity -->
      <F7ListItem accordion-item title="useEntity">
        <template #media>
          <F7Icon f7="square_pencil_fill" color="green" />
        </template>
        <F7AccordionContent>
          <F7Block>
            <h4>Entity CRUD Operations</h4>
            <p class="text-color-gray">
              Manages single entity with loading states, error handling, and
              optimistic updates.
            </p>
            <pre
              class="bg-color-gray padding"
              style="border-radius: 8px; font-size: 12px; overflow-x: auto"
            >
const {
  entity,
  loading,
  createEntity,
  updateEntity,
  deleteEntity
} = useEntity({
  create: (data) => model.create(data),
  update: (id, data) => model.update(id, data),
  delete: (id) => model.delete(id)
});</pre
            >
            <F7Button small fill href="/examples/entity-form"
              >View Example</F7Button
            >
          </F7Block>
        </F7AccordionContent>
      </F7ListItem>

      <!-- useForm -->
      <F7ListItem accordion-item title="useForm">
        <template #media>
          <F7Icon f7="checkmark_shield_fill" color="purple" />
        </template>
        <F7AccordionContent>
          <F7Block>
            <h4>Form Validation & State</h4>
            <p class="text-color-gray">
              Handles form state, validation rules, dirty tracking, and error
              messages.
            </p>
            <pre
              class="bg-color-gray padding"
              style="border-radius: 8px; font-size: 12px; overflow-x: auto"
            >
const {
  form,
  errors,
  isDirty,
  isValid,
  validate,
  setValue
} = useForm(
  { title: '', email: '' },
  {
    title: [
      { 
        validator: (v) => !!v, 
        message: 'Required' 
      }
    ]
  }
);</pre
            >
            <F7Button small fill href="/examples/entity-form"
              >View Example</F7Button
            >
          </F7Block>
        </F7AccordionContent>
      </F7ListItem>

      <!-- useEntityList -->
      <F7ListItem accordion-item title="useEntityList">
        <template #media>
          <F7Icon f7="list_bullet" color="orange" />
        </template>
        <F7AccordionContent>
          <F7Block>
            <h4>In-Memory List Management</h4>
            <p class="text-color-gray">
              Client-side filtering, sorting, pagination for in-memory arrays.
              Use <code>useKyselyQuery</code> for database queries.
            </p>
            <pre
              class="bg-color-gray padding"
              style="border-radius: 8px; font-size: 12px; overflow-x: auto"
            >
const items = ref([...])
const {
  items: paginatedItems,
  searchQuery,
  sortBy,
  selectedIds
} = useEntityList(items, {
  searchFields: ['name'],
  pageSize: 10
});</pre
            >
          </F7Block>
        </F7AccordionContent>
      </F7ListItem>
    </F7List>

    <!-- Database Layer -->
    <F7BlockTitle>Database Layer</F7BlockTitle>
    <F7List accordion-list inset>
      <F7ListItem accordion-item title="BaseModel">
        <template #media>
          <F7Icon f7="cylinder_fill" color="teal" />
        </template>
        <F7AccordionContent>
          <F7Block>
            <h4>CRUD Base Class</h4>
            <p class="text-color-gray">
              Provides common database operations. Extend it for custom models.
            </p>
            <pre
              class="bg-color-gray padding"
              style="border-radius: 8px; font-size: 12px; overflow-x: auto"
            >
class TaskModel extends BaseModel&lt;Task&gt; {
  constructor() {
    super(db, 'tasks')
  }
  
  async findByStatus(status: string) {
    return this.db
      .selectFrom(this.table)
      .selectAll()
      .where('status', '=', status)
      .execute()
  }
}</pre
            >
          </F7Block>
        </F7AccordionContent>
      </F7ListItem>

      <F7ListItem accordion-item title="BaseEntity">
        <template #media>
          <F7Icon f7="doc_text_fill" color="indigo" />
        </template>
        <F7AccordionContent>
          <F7Block>
            <h4>Entity Interface</h4>
            <p class="text-color-gray">
              Standard fields for all entities: id, created_at, updated_at,
              created_by, updated_by.
            </p>
            <pre
              class="bg-color-gray padding"
              style="border-radius: 8px; font-size: 12px; overflow-x: auto"
            >
interface Task extends BaseEntity {
  title: string
  status: 'pending' | 'completed'
  priority: 'low' | 'high'
}</pre
            >
          </F7Block>
        </F7AccordionContent>
      </F7ListItem>
    </F7List>

    <!-- Key Features -->
    <F7BlockTitle>Key Features</F7BlockTitle>
    <F7List inset>
      <F7ListItem
        title="✓ Offline-First"
        subtitle="Works without internet connection"
      />
      <F7ListItem
        title="✓ Real-time Sync"
        subtitle="PowerSync watches for changes"
      />
      <F7ListItem title="✓ Type-Safe" subtitle="TypeScript + Kysely" />
      <F7ListItem title="✓ Modular" subtitle="Clean separation of concerns" />
      <F7ListItem title="✓ Reactive" subtitle="Vue Composition API" />
      <F7ListItem title="✓ Mobile-Ready" subtitle="Framework7 components" />
    </F7List>

    <!-- Try Examples -->
    <F7Block>
      <F7Button large fill color="blue" href="/examples">
        <F7Icon f7="play_fill" class="margin-right" />
        Try Interactive Examples
      </F7Button>
    </F7Block>

    <!-- Version Info -->
    <F7Block class="text-align-center margin-top">
      <p class="text-color-gray">
        <strong>Vuena v1.0.0</strong><br />
        Built with ❤️ using Vue 3, PowerSync, and Kysely
      </p>
    </F7Block>
  </F7Page>
</template>

<script setup lang="ts">
const authStore = useAuthStore();
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}
</style>
