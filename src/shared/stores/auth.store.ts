import type { Session } from "@supabase/supabase-js";
import { powerSync } from "@/shared/database";
import { databaseConnector } from "@/shared/database/config/connector.database";

export const useAuthStore = defineStore(
  "auth",
  () => {
    const session = ref<Session | null>(null);
    const user = computed(() => session.value?.user ?? null);
    const isAuthenticated = computed(() => !!session.value);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const syncConnected = ref(false);

    async function connectPowerSync() {
      if (!session.value) return;

      try {
        // Initialize PowerSync connection with authenticated user
        await powerSync.connect(databaseConnector);
        syncConnected.value = true;
        console.log("✓ PowerSync connected and syncing");
      } catch (e) {
        console.error("Failed to connect PowerSync:", e);
      }
    }

    async function disconnectPowerSync() {
      try {
        await powerSync.disconnect();
        syncConnected.value = false;
        console.log("✓ PowerSync disconnected");
      } catch (e) {
        console.error("Failed to disconnect PowerSync:", e);
      }
    }

    async function init() {
      loading.value = true;
      try {
        const { data } = await databaseConnector.client.auth.getSession();
        session.value = data.session;

        // Connect PowerSync if already authenticated
        if (data.session) {
          await connectPowerSync();
        }

        databaseConnector.client.auth.onAuthStateChange(
          async (_event, _session) => {
            const wasAuthenticated = !!session.value;
            const isNowAuthenticated = !!_session;

            session.value = _session;

            // Handle PowerSync connection based on auth state
            if (isNowAuthenticated && !wasAuthenticated) {
              // User just logged in
              await connectPowerSync();
            } else if (!isNowAuthenticated && wasAuthenticated) {
              // User just logged out
              await disconnectPowerSync();
            }
          }
        );
      } catch (e: any) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    }

    async function login(email: string, password: string) {
      loading.value = true;
      error.value = null;
      try {
        await databaseConnector.login(email, password);
        // PowerSync connection will be handled by onAuthStateChange
      } catch (e: any) {
        error.value = e.message;
        throw e;
      } finally {
        loading.value = false;
      }
    }

    async function register(email: string, password: string, fullName: string) {
      loading.value = true;
      error.value = null;
      try {
        await databaseConnector.signup(email, password, fullName);
        // PowerSync connection will be handled by onAuthStateChange
      } catch (e: any) {
        error.value = e.message;
        throw e;
      } finally {
        loading.value = false;
      }
    }

    async function resetPassword(email: string) {
      loading.value = true;
      error.value = null;
      try {
        const { error: authError } =
          await databaseConnector.client.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + "/reset-password",
          });
        if (authError) throw authError;
      } catch (e: any) {
        error.value = e.message;
        throw e;
      } finally {
        loading.value = false;
      }
    }

    async function logout() {
      loading.value = true;
      try {
        await databaseConnector.client.auth.signOut();
        await disconnectPowerSync();
        session.value = null;
      } finally {
        loading.value = false;
      }
    }

    return {
      session,
      user,
      isAuthenticated,
      loading,
      error,
      syncConnected,
      init,
      login,
      register,
      resetPassword,
      logout,
      connectPowerSync,
      disconnectPowerSync,
    };
  },
  {
    persist: true,
  }
);
