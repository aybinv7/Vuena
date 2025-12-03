<template>
  <F7Page login-screen>
    <F7LoginScreenTitle>FairShare</F7LoginScreenTitle>

    <F7Block>
      <F7Segmented strong>
        <F7Button :active="isLogin" @click="isLogin = true">Log In</F7Button>
        <F7Button :active="!isLogin" @click="isLogin = false">Sign Up</F7Button>
      </F7Segmented>
    </F7Block>

    <F7List form style="min-height: 170px">
      <F7ListInput
        v-if="!isLogin"
        label="Name"
        type="text"
        placeholder="Your full name"
        :value="name"
        @input="name = $event.target.value"
        clear-button
      />
      <F7ListInput
        label="Email"
        type="email"
        placeholder="Your email"
        :value="email"
        @input="email = $event.target.value"
        clear-button
      />
      <F7ListInput
        label="Password"
        type="password"
        placeholder="Your password"
        :value="password"
        @input="password = $event.target.value"
        clear-button
      />
    </F7List>

    <F7Block>
      <F7Button fill large @click="handleAuth" :loading="authStore.loading">
        {{ isLogin ? "Log In" : "Sign Up" }}
      </F7Button>
      <div v-if="isLogin" class="margin-top text-align-center">
        <F7Link @click="showForgotPassword = true">Forgot Password?</F7Link>
      </div>
    </F7Block>

    <F7Block v-if="authStore.error" class="text-color-red text-align-center">
      {{ authStore.error }}
    </F7Block>

    <F7Sheet
      v-model:opened="showForgotPassword"
      swipe-to-close
      backdrop
      style="height: auto"
    >
      <F7PageContent>
        <F7BlockTitle large>Reset Password</F7BlockTitle>
        <F7Block>
          <p>Enter your email to receive reset instructions.</p>
        </F7Block>
        <F7List form>
          <F7ListInput
            label="Email"
            type="email"
            placeholder="Your email"
            :value="resetEmail"
            @input="resetEmail = $event.target.value"
            clear-button
          />
        </F7List>
        <F7Block>
          <F7Button
            fill
            large
            @click="handleResetPassword"
            :loading="authStore.loading"
          >
            Send Instructions
          </F7Button>
        </F7Block>
      </F7PageContent>
    </F7Sheet>
  </F7Page>
</template>

<script setup lang="ts">
const authStore = useAuthStore();
const isLogin = ref(true);
const email = ref("");
const password = ref("");
const name = ref("");
const resetEmail = ref("");
const showForgotPassword = ref(false);

const handleAuth = async () => {
  if (!email.value || !password.value) {
    f7.dialog.alert("Please fill in all fields");
    return;
  }

  if (!isLogin.value && !name.value) {
    f7.dialog.alert("Please enter your name");
    return;
  }

  try {
    if (isLogin.value) {
      await authStore.login(email.value, password.value);
    } else {
      await authStore.register(email.value, password.value, name.value);
      f7.dialog.alert(
        "Account created! Please check your email to confirm your registration."
      );
    }
  } catch (e) {
    // Error is handled in store and displayed in UI
  }
};

const handleResetPassword = async () => {
  if (!resetEmail.value) return;

  try {
    await authStore.resetPassword(resetEmail.value);
    showForgotPassword.value = false;
    f7.dialog.alert("Password reset instructions sent to your email.");
    resetEmail.value = "";
  } catch (e) {
    f7.dialog.alert("Failed to send reset email.");
  }
};
</script>
