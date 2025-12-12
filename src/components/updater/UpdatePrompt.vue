<template>
  <f7-popup
    :opened="show"
    :close-on-backdrop-click="false"
    class="update-popup"
    :class="{ 'update-blocked': isBlocked }"
  >
    <f7-page class="!pt-20">
      <div
        class="update-container display-flex flex-direction-column justify-content-center align-items-center height-100"
      >
        <!-- Animated Icon/Illustration -->
        <div class="icon-wrapper !mt-10 margin-bottom">
          <f7-icon
            f7="rocket_fill"
            size="64"
            class="text-color-primary"
          ></f7-icon>
        </div>

        <f7-block-title large class="no-margin text-align-center">{{
          updateTypeLabel
        }}</f7-block-title>
        <div
          class="text-color-gray margin-bottom text-align-center font-size-large"
        >
          {{ versionLabel }}
        </div>

        <!-- Release Notes -->
        <f7-block class="width-100 release-notes-block margin-top">
          <div
            class="release-notes-content padding bg-color-white text-color-black rounded-lg shadow-sm"
            style="max-height: 200px; overflow-y: auto"
          >
            <p><strong>What's New:</strong></p>
            <div v-html="releaseNotes" class="pre-wrap"></div>
          </div>
        </f7-block>

        <!-- Progress Bar -->
        <div
          v-if="isDownloading"
          class="width-100 padding-horizontal margin-vertical"
        >
          <f7-progressbar
            :progress="progress.percent"
            class="height-8 rounded-full"
          ></f7-progressbar>
          <div class="text-align-center margin-top-half text-color-gray">
            {{ progress.percent }}% Downloaded
          </div>
        </div>

        <!-- Buttons -->
        <div
          class="width-100 padding margin-top auto-margin-top buttons-container"
        >
          <f7-button
            large
            fill
            round
            :loading="isDownloading"
            @click="handleUpdate"
            class="margin-bottom"
          >
            {{ isDownloading ? "Downloading..." : "Update Now" }}
          </f7-button>

          <f7-button
            v-if="showDismiss"
            large
            round
            color="gray"
            class="margin-top"
            @click="handleLater"
          >
            Remind Me Later
          </f7-button>

          <div
            v-if="isMandatory"
            class="text-align-center text-color-red margin-top-half font-size-small"
          >
            <f7-icon f7="exclamationmark_circle_fill" size="14"></f7-icon>
            This update is required.
          </div>
        </div>
      </div>
    </f7-page>
  </f7-popup>
</template>
<script setup lang="ts">
const {
  updateAvailable,
  currentUpdate,
  isDownloading,
  progress,
  startDownload,
  isBlocked,
  dismissUpdate,
  nativeUpdatePending,
} = useUpdater();

const show = computed(() => updateAvailable.value);
const isMandatory = computed(() => currentUpdate.value?.required ?? false);
const isNativeUpdate = computed(() => currentUpdate.value?.type === "native");

const updateTypeLabel = computed(() => {
  if (isNativeUpdate.value) {
    return nativeUpdatePending.value ? "Required App Update" : "App Update";
  }
  return "Update Available";
});

const versionLabel = computed(() => {
  return currentUpdate.value ? `Version ${currentUpdate.value.version}` : "";
});

// Format bytes
const totalSize = computed(() => {
  if (!currentUpdate.value || currentUpdate.value.type !== "native") return "";
  return "";
});

const releaseNotes = computed(() => {
  return (
    currentUpdate.value?.release_notes ||
    "Performance improvements and bug fixes."
  );
});

function handleUpdate() {
  startDownload();
}

function handleLater() {
  // Only dismiss if not mandatory
  if (!isMandatory.value) {
    dismissUpdate();
  }
}

const showDismiss = computed(() => !isMandatory.value && !isDownloading.value);
</script>

<style scoped>
.update-popup {
  /* Ensure it covers everything */
  z-index: 13500 !important;
}

.update-page {
  background-color: var(--f7-page-bg-color);
}

.icon-wrapper {
  background: var(
    --f7-theme-color-opacity-10,
    rgba(var(--f7-theme-color-rgb), 0.1)
  );
  padding: 24px;
  border-radius: 50%;
  animation: bounce 2s infinite;
}

.release-notes-block {
  max-width: 500px;
}

.buttons-container {
  max-width: 400px;
}

.pre-wrap {
  white-space: pre-wrap;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Dark mode adjustments */
:root.dark .release-notes-content {
  background-color: #1c1c1d; /* iOS dark gray */
  color: white;
}
</style>
