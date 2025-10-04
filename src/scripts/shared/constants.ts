/**
 * @file Centralized constants for the Discolors extension.
 * @description This file exports all static values, magic strings, and default
 * configurations to avoid hardcoding them throughout the application.
 */

// --- Imports ---
import { ThemeConfig } from './types';

// --- API Endpoints ---

/**
 * The API endpoint for fetching the latest GitHub release of the repository.
 * Used by the background script to check for updates.
 * @type {string}
 */
export const GITHUB_API_URL =
  'https://api.github.com/repos/uictorius/Discolors/releases/latest';

// --- Extension Settings ---

/**
 * The interval, in minutes, for the recurring alarm that checks for updates.
 * @type {number}
 */
export const UPDATE_CHECK_INTERVAL_MINUTES = 60;

/**
 * The unique name for the Chrome alarm that triggers the update check.
 * @type {string}
 */
export const UPDATE_ALARM_NAME = 'checkUpdateAlarm';

// --- Default State ---

/**
 * The default theme configuration object.
 * This is used when a user opens the popup for the first time before saving
 * any custom settings.
 * @type {ThemeConfig}
 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  colorCount: 5,
  colors: ['#213220', '#344e41', '#588157', '#a3b18a', '#dad7cd'],
  gradientDirection: '90deg',
  useRandomColors: false,
};
