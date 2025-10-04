/**
 * @file background/index.ts
 * @summary Service worker for the Discolors Chrome extension.
 * @description
 * Handles background tasks such as checking for extension updates
 * and managing browser action badges. This script runs in the
 * background as a service worker and initializes all necessary
 * event listeners for update checks.
 */

// --- Imports ---
import {
  GITHUB_API_URL,
  UPDATE_ALARM_NAME,
  UPDATE_CHECK_INTERVAL_MINUTES,
} from '../shared/constants';
import { setUpdateInfo } from '../shared/storage';
import { isNewerVersion } from '../shared/utils';
import { GitHubRelease } from '../shared/types';

// --- Functions ---

/**
 * Updates the Chrome extension action badge with a text and optional background color.
 * Passing an empty string for `text` will clear the badge.
 *
 * @param text - The text to display on the badge (e.g., "NEW").
 * @param color - Optional background color for the badge. Defaults to `#4CAF50`.
 * @returns void
 */
function updateBadge(text: string, color: string = '#4CAF50'): void {
  // Set the badge text. An empty string effectively removes the badge.
  chrome.action.setBadgeText({ text });

  // Only apply a background color if the badge text is present.
  if (text) {
    chrome.action.setBadgeBackgroundColor({ color });
  }
}

/**
 * Checks GitHub for the latest release of Discolors and compares it
 * with the currently installed version. If a newer version exists,
 * updates local storage and displays a "NEW" badge.
 *
 * @async
 * @returns A promise that resolves when the update check is completed.
 */
async function checkForUpdate(): Promise<void> {
  try {
    // Fetch latest release info from GitHub API
    const response = await fetch(GITHUB_API_URL);
    if (!response.ok) {
      throw new Error(`GitHub API responded with status: ${response.status}`);
    } // Cast the JSON response to our new type for better safety

    const release = (await response.json()) as GitHubRelease; // Extract the version number from tag_name (e.g., "v1.2.0" -> "1.2.0")

    const latestVersion = release?.tag_name?.replace(/^v/, '');

    if (!latestVersion || !release.html_url) {
      throw new Error(
        'Could not find valid release tag or URL in the API response.'
      );
    } // Retrieve current extension version from the manifest

    const currentVersion = chrome.runtime.getManifest().version; // Compare the current and latest versions using the semver-backed utility

    if (isNewerVersion(currentVersion, latestVersion)) {
      // If a newer version exists, update storage and show badge
      await setUpdateInfo({
        updateAvailable: true,
        latestVersion,
        latestUrl: release.html_url,
      });
      updateBadge('NEW');
    } else {
      // Otherwise, clear update info and remove badge
      await setUpdateInfo({ updateAvailable: false });
      updateBadge('');
    }
  } catch (error) {
    // Refactored error handling: safely extract the message and log.
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.';

    console.warn('Discolors: Error checking for update.', errorMessage); // Always reset update state on any error (e.g., network issues or invalid response)

    await setUpdateInfo({ updateAvailable: false });
    updateBadge('');
  }
}

/**
 * Initializes all event listeners required for the service worker.
 * This includes installation, alarms, and Chrome startup events.
 *
 * @remarks
 * Called once when the service worker starts.
 */
function initializeEventListeners(): void {
  // Triggered when the extension is installed, updated, or Chrome is updated
  chrome.runtime.onInstalled.addListener(() => {
    // Create a recurring alarm to check for updates periodically
    chrome.alarms.create(UPDATE_ALARM_NAME, {
      periodInMinutes: UPDATE_CHECK_INTERVAL_MINUTES,
    });

    // Perform an immediate check after installation or update
    checkForUpdate();
  });

  // Triggered when an alarm fires
  chrome.alarms.onAlarm.addListener((alarm) => {
    // Ensure the alarm is the one for update checks
    if (alarm.name === UPDATE_ALARM_NAME) {
      checkForUpdate();
    }
  });

  // Triggered when the browser starts up
  chrome.runtime.onStartup.addListener(() => {
    checkForUpdate();
  });
}

// --- Initialization ---

// Set up all service worker event listeners
initializeEventListeners();
