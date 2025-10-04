/**
 * @file content/index.ts
 * @summary Content script for the Discolors Chrome extension.
 * @description
 * Injected into Discord pages to apply custom themes. Handles theme
 * generation, CSS injection, and ensures the theme persists across
 * Discord's dynamic UI updates using MutationObservers.
 */

// --- Imports ---
import { getThemeConfig, setThemeConfig } from '../shared/storage';
import { ThemeConfig, ThemeUpdateMessage } from '../shared/types';
import { sanitizeGradientDirection } from '../shared/utils';

// --- Constants ---

/** Unique ID for the injected <style> element containing theme CSS. */
const STYLE_ELEMENT_ID = 'discolors-theme-style';

/** CSS class added to <html> element to activate the custom theme. */
const THEME_CLASS_NAME = 'custom-theme-background';

// --- Theme Generation Logic ---

/**
 * Detects the current Discord theme mode.
 *
 * @returns {'light' | 'dark'} The current theme mode.
 */
function detectThemeMode(): 'light' | 'dark' {
  const htmlClass = document.documentElement.className;
  if (htmlClass.includes('theme-light')) return 'light';
  if (htmlClass.includes('theme-dark')) return 'dark';
  return 'dark'; // Default fallback
}

/**
 * Lightens or darkens a hexadecimal color by a specific amount.
 *
 * @param hex - The base hex color (e.g., "#RRGGBB").
 * @param amount - Amount to adjust: positive to lighten, negative to darken.
 * @returns The adjusted hex color.
 */
const adjustColor = (hex: string, amount: number): string => {
  let usePound = false;
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
    usePound = true;
  }
  const num = parseInt(hex, 16);
  const r = Math.max(Math.min(255, (num >> 16) + amount), 0);
  const g = Math.max(Math.min(255, ((num >> 8) & 0x00ff) + amount), 0);
  const b = Math.max(Math.min(255, (num & 0x0000ff) + amount), 0);
  return (
    (usePound ? '#' : '') +
    ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
  );
};

/**
 * Determines the optimal text color (black or white) based on
 * the background color for readability.
 *
 * @param hex - Background hex color.
 * @returns Either '#000000' or '#ffffff' depending on contrast.
 */
function getTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 128 ? '#000000' : '#ffffff';
}

/**
 * Generates the complete CSS string based on the theme configuration.
 *
 * @param config - The user's selected theme settings.
 * @returns CSS string to inject into the page.
 */
function generateThemeCSS(config: ThemeConfig): string {
  const isDark = detectThemeMode() === 'dark';
  const count = config.colorCount;

  const colorsToUse = config.useRandomColors
    ? Array.from(
        { length: count },
        () =>
          `#${Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, '0')}`
      )
    : config.colors.slice(0, count);

  if (colorsToUse.length === 0) return '';

  const direction = config.useRandomColors
    ? `${Math.floor(Math.random() * 360)}deg`
    : sanitizeGradientDirection(config.gradientDirection);
  const colorsStr = colorsToUse.join(', ');
  const mainColor = colorsToUse[0];

  const backgroundValue =
    colorsToUse.length > 1
      ? `linear-gradient(${direction}, ${colorsStr})`
      : mainColor;

  const darkVariant = adjustColor(mainColor, -35);
  const lightVariant = adjustColor(mainColor, 130);
  const darkTextColor = getTextColor(darkVariant);
  const lightTextColor = getTextColor(lightVariant);
  const baseColorAmount = isDark ? 70.4 : 15.2;
  const textColorAmount = isDark ? 30 : 40;

  return `
    .${THEME_CLASS_NAME} {
        --custom-theme-background: ${backgroundValue} !important;
        --custom-theme-base-color-dark: ${darkVariant} !important;
        --custom-theme-text-color-dark: ${darkTextColor} !important;
        --custom-theme-base-color-light: ${lightVariant} !important;
        --custom-theme-text-color-light: ${lightTextColor} !important;
        --custom-theme-base-color-amount: ${baseColorAmount}%;
        --custom-theme-text-color-amount: ${textColorAmount}%;
    }
    body { 
      background: var(--custom-theme-background); 
    }
  `;
}

// --- DOM Manipulation & Event Handling ---

/**
 * Injects or updates the theme's <style> element and applies
 * the activation class to the <html> element.
 *
 * @param config - Theme configuration to apply.
 */
function applyTheme(config: ThemeConfig): void {
  const head = document.head;
  if (!head) return;

  let styleElement = document.getElementById(
    STYLE_ELEMENT_ID
  ) as HTMLStyleElement | null;
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = STYLE_ELEMENT_ID;
    head.appendChild(styleElement);
  }

  styleElement.textContent = generateThemeCSS(config);
  document.documentElement.classList.add(THEME_CLASS_NAME);
  console.log('[Discolors] Theme applied.');
}

/**
 * Handles messages from the extension popup and updates the theme accordingly.
 *
 * @param message - Message received from the popup script.
 */
async function handleMessages(message: ThemeUpdateMessage): Promise<void> {
  if (message.action === 'updateTheme') {
    const config = message.config;
    await setThemeConfig(config);
    applyTheme(config);
  }
}

/**
 * Sets up a MutationObserver to ensure the theme persists
 * even when Discord dynamically updates the UI.
 */
function initializePersistenceObserver(): void {
  const observer = new MutationObserver(() => {
    const html = document.documentElement;
    if (
      !html.classList.contains(THEME_CLASS_NAME) &&
      document.getElementById(STYLE_ELEMENT_ID)
    ) {
      html.classList.add(THEME_CLASS_NAME);
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
}

// --- Initialization ---

/**
 * Main entry point for the content script.
 * Loads saved theme, sets up listeners, and ensures persistence.
 */
async function main(): Promise<void> {
  chrome.runtime.onMessage.addListener(handleMessages);

  const savedConfig = await getThemeConfig();
  if (savedConfig) {
    applyTheme(savedConfig);
  }

  initializePersistenceObserver();
}

// Execute main
main();
