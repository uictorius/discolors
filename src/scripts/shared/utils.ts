/**
 * @file Utility functions for version comparison.
 * @description Provides helper functions for semantic version comparison across the extension.
 * Currently, it includes logic to determine if a version is newer than another.
 */

import { gt, coerce } from 'semver';

/**
 * Compares two semantic version strings (MAJOR.MINOR.PATCH).
 * Determines whether the `latest` version is strictly newer than the `current` version.
 *
 * It uses semver.coerce to ensure versions like "1.0" are treated as "1.0.0" for safe comparison.
 *
 * @param {string} current - The current version string (e.g., "1.0.0").
 * @param {string} latest - The latest version string (e.g., "1.3.0" or "1.2.1-beta").
 * @returns {boolean} `true` if the latest version is strictly newer, otherwise `false`.
 */
export function isNewerVersion(current: string, latest: string): boolean {
  try {
    // 1. Coerce versions to ensure they are in a valid X.Y.Z format (e.g., "1.0" -> "1.0.0").
    // We use the full coerced version string for comparison.
    const coercedCurrent = coerce(current)?.version;
    const coercedLatest = coerce(latest)?.version;

    // 2. Validate that coercion was successful
    if (!coercedCurrent || !coercedLatest) {
      console.warn('SemVer Coercion Failed for one or both versions.');
      return false;
    }

    // 3. Use the robust gt comparison function
    return gt(coercedLatest, coercedCurrent);
  } catch (error) {
    // This catch block handles potential errors from the gt() function itself,
    // although using coerce should prevent the 'Invalid Version' error.
    console.error('Discolors: Failed to compare versions using semver.', error);
    return false;
  }
}

/**
 * Sanitizes a CSS gradient direction string to ensure it contains only digits
 * followed by the 'deg' unit, preventing potential CSS injection.
 *
 * @param direction - The raw direction string (e.g., "90deg").
 * @returns The sanitized direction string (e.g., "90deg") or a default value ("90deg").
 */
export function sanitizeGradientDirection(direction: string): string {
  // Match only digits followed by 'deg'.
  const match = direction.match(/^(\d+)deg$/);

  // If the format is valid, clamp the value between 0 and 360 and return.
  if (match) {
    const degree = Math.min(360, Math.max(0, parseInt(match[1], 10)));
    return `${degree}deg`;
  }

  // Return a safe default if input is invalid.
  return '90deg';
}
