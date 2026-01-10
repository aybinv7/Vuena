/**
 * OTA Service
 * Wrapper for @capgo/capacitor-updater plugin
 *
 * With autoUpdate enabled, the plugin handles most operations automatically.
 * This service provides utility functions for manual control and debugging.
 */
import { CapacitorUpdater } from "@capgo/capacitor-updater";

/**
 * Notify plugin that app is ready
 * CRITICAL: This enables OTA auto-updates and prevents rollback
 * Only call this AFTER confirming no native update is pending
 */
export async function notifyAppReady(): Promise<void> {
  try {
    await CapacitorUpdater.notifyAppReady();
    console.log("[OTA] App marked as ready - auto-updates enabled");
  } catch (error) {
    console.warn("[OTA] Failed to notify app ready:", error);
  }
}

/**
 * Get currently active bundle info
 */
export async function getCurrentBundle() {
  try {
    return await CapacitorUpdater.current();
  } catch (error) {
    console.error("[OTA] Failed to get current bundle:", error);
    return null;
  }
}

/**
 * List all downloaded bundles
 */
export async function listBundles() {
  try {
    return await CapacitorUpdater.list();
  } catch (error) {
    console.error("[OTA] Failed to list bundles:", error);
    return { bundles: [] };
  }
}

/**
 * Delete a specific bundle by ID
 */
export async function deleteBundle(id: string) {
  try {
    await CapacitorUpdater.delete({ id });
    console.log("[OTA] Bundle deleted:", id);
  } catch (error) {
    console.error("[OTA] Failed to delete bundle:", error);
  }
}

/**
 * Reset to the built-in bundle
 * Use for emergency recovery or testing
 */
export async function resetToBuiltin() {
  try {
    await CapacitorUpdater.reset();
    console.log("[OTA] Reset to builtin bundle");
  } catch (error) {
    console.error("[OTA] Failed to reset:", error);
  }
}

/**
 * Force reload the app with current bundle
 */
export async function reloadApp() {
  try {
    await CapacitorUpdater.reload();
  } catch (error) {
    console.error("[OTA] Failed to reload:", error);
  }
}

/**
 * Get device ID for channel management
 */
export async function getDeviceId(): Promise<string> {
  try {
    const result = await CapacitorUpdater.getDeviceId();
    return result.deviceId;
  } catch (error) {
    console.error("[OTA] Failed to get device ID:", error);
    return "unknown";
  }
}

/**
 * Set channel for this device
 */
export async function setChannel(channel: string): Promise<void> {
  try {
    await CapacitorUpdater.setChannel({ channel, triggerAutoUpdate: true });
    console.log("[OTA] Channel set to:", channel);
  } catch (error) {
    console.error("[OTA] Failed to set channel:", error);
  }
}

/**
 * Get current channel
 */
export async function getChannel(): Promise<string> {
  try {
    const result = await CapacitorUpdater.getChannel();
    return result.channel || "prod";
  } catch (error) {
    console.error("[OTA] Failed to get channel:", error);
    return "prod";
  }
}
