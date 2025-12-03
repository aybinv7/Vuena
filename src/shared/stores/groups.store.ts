export const useGroupsStore = defineStore("groups", () => {
  const groups = ref<GroupRecord[]>([]);
  const loading = ref(false);
  const authStore = useAuthStore();

  let watchSubscription: { dispose: () => void } | null = null;

  async function watchGroups() {
    if (watchSubscription) {
      console.log("Disposing previous watch subscription");
      watchSubscription.dispose();
      console.log("Previous watch subscription disposed");
      watchSubscription = null;
    }

    try {
      const userId = authStore.user?.id || "demo-user";

      // Watch for groups where the user is a member
      const query = db
        .selectFrom("groups as g")
        .innerJoin("members as m", "g.id", "m.group_id")
        .selectAll("g")
        .where("m.user_id", "=", userId)
        .orderBy("g.created_at", "desc");

      // @ts-ignore - db.watch is added by wrapPowerSyncWithKysely
      watchSubscription = db.watch(query, {
        onResult: (result) => {
          groups.value = result;
        },
      });
    } catch (error: any) {
      console.error("Error watching groups:", error);
    }
  }

  async function createGroup(name: string, currency: string = "USD") {
    if (!authStore.user) throw new Error("User must be logged in");

    const groupId = crypto.randomUUID();
    const now = new Date().toISOString();
    const userId = authStore.user.id;

    await db.transaction().execute(async (tx) => {
      // Create Group
      await tx
        .insertInto("groups")
        .values({
          id: groupId,
          name,
          currency,
          created_by: userId,
          created_at: now,
        })
        .execute();

      // Add Creator as Member
      await tx
        .insertInto("members")
        .values({
          id: crypto.randomUUID(),
          group_id: groupId,
          user_id: userId,
          joined_at: now,
        })
        .execute();
    });
  }

  function stopWatching() {
    if (watchSubscription) {
      watchSubscription.dispose();
      watchSubscription = null;
    }
  }

  async function clearAndResync() {
    try {
      loading.value = true;
      await powerSync.disconnectAndClear();
      await watchGroups();
    } catch (error) {
      console.error("Error clearing and resyncing:", error);
    } finally {
      loading.value = false;
    }
  }

  async function refreshGroups() {
    loading.value = true;
    try {
      const userId = authStore.user?.id || "demo-user";

      const result = await db
        .selectFrom("groups as g")
        .innerJoin("members as m", "g.id", "m.group_id")
        .selectAll("g")
        .where("m.user_id", "=", userId)
        .orderBy("g.created_at", "desc")
        .execute();

      groups.value = result as GroupRecord[];
    } catch (error) {
      console.error("Error refreshing groups:", error);
    } finally {
      loading.value = false;
    }
  }

  return {
    groups,
    loading,
    watchGroups,
    stopWatching,
    createGroup,
    clearAndResync,
    refreshGroups,
  };
});
