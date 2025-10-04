/**
 * @file popup/main.ts
 * @summary Main script for the Discolors extension popup UI.
 * @description
 * Handles all user interactions within the popup, including loading and saving
 * theme settings, updating UI state, and communicating with the content script.
 */

// --- Imports ---
import {
  getThemeConfig,
  setThemeConfig,
  getUpdateInfo,
} from '../shared/storage';
import { ThemeConfig, ThemeUpdateMessage } from '../shared/types';
import { DEFAULT_THEME_CONFIG } from '../shared/constants';
import '../../styles/popup.scss';

// --- DOM Element Constants (updateBanner declaration REMOVED from here) ---
const colorCountSelect = document.getElementById(
  'colorCount'
) as HTMLSelectElement;
const colorsLabel = document.getElementById('colors-label') as HTMLLabelElement;
const colorsContainer = document.querySelector(
  '.colors-container'
) as HTMLDivElement;
const colorInputs = Array.from(
  colorsContainer.querySelectorAll('input[type="color"]')
) as HTMLInputElement[];
const gradientControls = document.getElementById(
  'gradient-controls'
) as HTMLDivElement;
const gradientDirectionSlider = document.getElementById(
  'gradientDirection'
) as HTMLInputElement;
const directionValueSpan = document.getElementById(
  'directionValue'
) as HTMLSpanElement;
const useRandomColorsCheckbox = document.getElementById(
  'useRandomColors'
) as HTMLInputElement;
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const statusP = document.getElementById('status') as HTMLParagraphElement;
const versionSpan = document.getElementById('version') as HTMLSpanElement;

// --- UI Logic Functions ---
// ... (updateUIView, loadConfigIntoUI, getConfigFromUI functions remain the same)

/**
 * Updates the visibility of UI elements based on user selections.
 *
 * @param count - Number of colors selected.
 * @param useRandom - Whether the "Use Random Colors" option is enabled.
 */
function updateUIView(count: number, useRandom: boolean): void {
  colorsLabel.style.display = useRandom ? 'none' : 'block';
  colorsContainer.style.display = useRandom ? 'none' : 'block';

  colorInputs.forEach((input, index) => {
    input.style.display = index < count ? '' : 'none';
  });

  const showGradient = count > 1 && !useRandom;
  gradientControls.style.display = showGradient ? 'block' : 'none';
}

/**
 * Populates the popup UI inputs with a given theme configuration.
 *
 * @param config - Theme configuration to load into the UI.
 */
function loadConfigIntoUI(config: ThemeConfig): void {
  colorCountSelect.value = String(config.colorCount);
  config.colors.forEach((color, index) => {
    if (colorInputs[index]) {
      colorInputs[index].value = color;
    }
  });
  gradientDirectionSlider.value = config.gradientDirection.replace('deg', '');
  directionValueSpan.textContent = `${gradientDirectionSlider.value}°`;
  useRandomColorsCheckbox.checked = config.useRandomColors;

  updateUIView(config.colorCount, config.useRandomColors);
}

/**
 * Reads the current form input values and constructs a ThemeConfig object.
 *
 * @returns Theme configuration derived from the popup UI.
 */
function getConfigFromUI(): ThemeConfig {
  const colorCount = parseInt(colorCountSelect.value, 10);
  return {
    colorCount,
    colors: colorInputs.slice(0, colorCount).map((input) => input.value),
    gradientDirection: `${gradientDirectionSlider.value}deg`,
    useRandomColors: useRandomColorsCheckbox.checked,
  };
}

// --- Core Logic Functions ---

/**
 * Checks for available updates and displays a prominent banner if one is found.
 *
 * @async
 */
async function displayUpdateStatus(): Promise<void> {
  const updateBanner = document.getElementById(
    'updateBanner'
  ) as HTMLDivElement;
  if (!updateBanner) {
    console.error('Discolors: Update banner DOM element not found.');
    return;
  }

  try {
    const { updateAvailable, latestVersion, latestUrl } = await getUpdateInfo();

    if (updateAvailable && latestVersion && latestUrl) {
      // Populate banner with update info
      updateBanner.innerHTML = `
        🆕 <strong>Update Available!</strong> New v${latestVersion} is out. 
        <a href="${latestUrl}" target="_blank" rel="noopener noreferrer">Click here to download.</a>
      `;
      updateBanner.style.display = 'block';
    } else {
      updateBanner.innerHTML = '';
      updateBanner.style.display = 'none';
    }

    // Clear status message to prioritize the banner
    statusP.textContent = '';
  } catch (error) {
    console.error('Discolors: Failed to retrieve update info.', error);
  }
}

/**
 * Sends the new theme configuration to the active content script in Discord.
 * Handles errors gracefully if the content script is unavailable.
 *
 * @param config - Theme configuration to apply.
 * @async
 */
async function notifyContentScript(config: ThemeConfig): Promise<void> {
  const [tab] = await chrome.tabs.query({
    active: true,
    url: '*://discord.com/*',
  });

  if (tab?.id) {
    const message: ThemeUpdateMessage = { action: 'updateTheme', config };
    try {
      await chrome.tabs.sendMessage(tab.id, message);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.warn(
        `Discolors: Could not send message to content script. Error: ${errorMessage}`
      );

      // Display persistent update status first, then show temporary error
      await displayUpdateStatus();
      statusP.textContent = 'Could not apply. Please reload the Discord tab.';
      statusP.style.color = 'orange';

      // Clear only the temporary status message after 2 seconds
      setTimeout(() => {
        statusP.textContent = '';
        statusP.style.color = '';
      }, 2000);
    }
  } else {
    console.warn('Discolors: No active Discord tab found to notify.');
  }
}

// --- Main Initialization ---

/**
 * Initializes the popup UI:
 * - Applies system dark/light mode.
 * - Loads saved theme configuration.
 * - Updates UI elements.
 * - Attaches event listeners for user interactions.
 */
async function main(): Promise<void> {
  const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const applySystemTheme = (isDark: boolean) =>
    document.documentElement.setAttribute(
      'data-theme',
      isDark ? 'dark' : 'light'
    );

  applySystemTheme(themeQuery.matches);
  themeQuery.addEventListener('change', (e) => applySystemTheme(e.matches));

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isOnDiscord = tab?.url?.includes('discord.com') ?? false;

  versionSpan.textContent = chrome.runtime.getManifest().version;
  // Load update status on popup open - This handles both badge and banner visibility
  await displayUpdateStatus();

  const savedConfig = await getThemeConfig();
  loadConfigIntoUI(savedConfig ?? DEFAULT_THEME_CONFIG);

  if (!isOnDiscord) saveBtn.textContent = 'Save and go to Discord';

  colorCountSelect.addEventListener('change', () =>
    updateUIView(
      parseInt(colorCountSelect.value, 10),
      useRandomColorsCheckbox.checked
    )
  );

  useRandomColorsCheckbox.addEventListener('change', () =>
    updateUIView(
      parseInt(colorCountSelect.value, 10),
      useRandomColorsCheckbox.checked
    )
  );

  gradientDirectionSlider.addEventListener('input', () => {
    directionValueSpan.textContent = `${gradientDirectionSlider.value}°`;
  });

  saveBtn.addEventListener('click', async () => {
    const newConfig = getConfigFromUI();
    await setThemeConfig(newConfig);

    if (isOnDiscord) {
      await notifyContentScript(newConfig);

      // We only show the success message if notifyContentScript didn't throw an error
      // (which is handled inside notifyContentScript)
      statusP.textContent = 'Settings saved!';
      statusP.style.color = 'green';

      // Clear only the temporary status message after 2 seconds
      setTimeout(() => {
        statusP.textContent = '';
        statusP.style.color = '';
      }, 2000);
    } else {
      chrome.tabs.create({ url: 'https://discord.com/app' });
    }
  });
}

// Execute main when DOM content is fully loaded
document.addEventListener('DOMContentLoaded', main);
