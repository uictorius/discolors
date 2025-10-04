/**
 * @file Abstraction layer for Chrome's storage API.
 * @description This module provides type-safe, async functions for getting and
 * setting data in both `chrome.storage.sync` (for user settings) and
 * `chrome.storage.local` (for internal state). It also includes error handling.
 */

// --- Imports ---
import { ThemeConfig, UpdateInfo } from './types';

// --- Storage Keys ---
const THEME_CONFIG_KEY = 'themeConfig';
const UPDATE_INFO_KEYS = ['updateAvailable', 'latestVersion', 'latestUrl'];

// --- Sync Storage (for user-facing settings) ---

/**
 * Retrieves the user's saved theme configuration from `chrome.storage.sync`.
 * @async
 * @returns {Promise<ThemeConfig | null>} A promise that resolves to the saved `ThemeConfig`, or `null` if not found or an error occurs.
 */
export async function getThemeConfig(): Promise<ThemeConfig | null> {
  try {
    const result = await chrome.storage.sync.get(THEME_CONFIG_KEY);
    return result[THEME_CONFIG_KEY] || null;
  } catch (error) {
    console.error(
      'Discolors: Failed to retrieve theme config from storage.',
      error
    );
    return null;
  }
}

/**
 * Saves the user's theme configuration to `chrome.storage.sync`.
 * @async
 * @param {ThemeConfig} config - The theme configuration object to save.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
export async function setThemeConfig(config: ThemeConfig): Promise<void> {
  try {
    await chrome.storage.sync.set({ [THEME_CONFIG_KEY]: config });
  } catch (error) {
    console.error('Discolors: Failed to save theme config to storage.', error);
  }
}

// --- Local Storage (for internal, non-synced state) ---

/**
 * Retrieves update information from `chrome.storage.local`.
 * @async
 * @returns {Promise<UpdateInfo>} A promise that resolves to the saved `UpdateInfo`, or a default object if not found or an error occurs.
 */
export async function getUpdateInfo(): Promise<UpdateInfo> {
  const defaults: UpdateInfo = {
    updateAvailable: false,
    latestVersion: undefined,
    latestUrl: undefined,
  };

  try {
    const result = await chrome.storage.local.get(UPDATE_INFO_KEYS);
    // Combine fetched results with defaults to ensure a complete object is returned.
    return {
      updateAvailable: result.updateAvailable ?? defaults.updateAvailable,
      latestVersion: result.latestVersion,
      latestUrl: result.latestUrl,
    };
  } catch (error) {
    console.error(
      'Discolors: Failed to retrieve update info from storage.',
      error
    );
    return defaults;
  }
}

/**
 * Saves update information to `chrome.storage.local`.
 * @async
 * @param {UpdateInfo} info - The update information object to save.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
export async function setUpdateInfo(info: UpdateInfo): Promise<void> {
  try {
    await chrome.storage.local.set(info);
  } catch (error) {
    console.error('Discolors: Failed to save update info to storage.', error);
  }
}
