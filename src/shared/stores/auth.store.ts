import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { databaseConnector } from "@/shared/database/connector.database";
import type { Session } from "@supabase/supabase-js";

export const useAuthStore = defineStore(
  "auth",
  () => {
    const session = ref<Session | null>(null);
    const user = computed(() => session.value?.user ?? null);
    const isAuthenticated = computed(() => !!session.value);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function init() {
      loading.value = true;
      try {
        const { data } = await databaseConnector.client.auth.getSession();
        session.value = data.session;

        databaseConnector.client.auth.onAuthStateChange((_event, _session) => {
          session.value = _session;
        });
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
      init,
      login,
      register,
      resetPassword,
      logout,
    };
  },
  {
    persist: true,
  }
);
