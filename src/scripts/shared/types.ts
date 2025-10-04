/**
 * @file Type definitions for the Discolors extension.
 * @description This file contains all shared TypeScript interfaces used across
 * different parts of the extension, ensuring data consistency and type safety.
 */

/**
 * Defines the structure for the theme configuration that is saved by the user
 * and applied by the content script.
 */
export interface ThemeConfig {
  /** The number of active colors to use, from 1 to 5. */
  colorCount: number;
  /** An array of user-selected hexadecimal color strings. */
  colors: string[];
  /** The CSS direction for the linear gradient (e.g., "90deg"). */
  gradientDirection: string;
  /** A flag to determine if randomly generated colors should be used instead of user-selected ones. */
  useRandomColors: boolean;
}

/**
 * Defines the structure for the update information fetched from GitHub and
 * stored in `chrome.storage.local`.
 */
export interface UpdateInfo {
  /** A flag indicating if a newer version of the extension is available. */
  updateAvailable: boolean;
  /** The version string of the latest release (e.g., "2.1.0"), if available. */
  latestVersion?: string;
  /** The URL pointing to the latest GitHub release page, if available. */
  latestUrl?: string;
}

/**
 * Defines the structure of the message sent from the popup script to the
 * content script to trigger a theme update.
 */
export interface ThemeUpdateMessage {
  /** A string literal used to identify the action to be performed by the receiver. */
  action: 'updateTheme';
  /** The payload of the message, containing the new theme configuration. */
  config: ThemeConfig;
}

/**
 * Defines the structure of a GitHub release object returned by the API.
 * We only need the tag name and the URL.
 */
export interface GitHubRelease {
  tag_name: string;
  html_url: string;
}
