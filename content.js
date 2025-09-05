// ============================
// Content Script for Discolors Extension
// Handles theme detection, application, and dynamic updates
// ============================

// ============================
// Theme Detection
// ============================
function detectThemeMode() {
    const htmlClass = document.documentElement.className;
    if (htmlClass.includes("theme-light")) return "light";
    if (htmlClass.includes("theme-dark")) return "dark";
    return "dark"; // Default to dark
}

// ============================
// Theme Configuration
// ============================
let themeConfig = null; // No default config

// ============================
// Load saved configuration from Chrome Storage
// ============================
function loadSavedConfig() {
    chrome.storage.sync.get(null, (config) => {
        if (config && Object.keys(config).length > 0) {
            themeConfig = { ...config };
            applyCustomCSS();
        }
        // Do nothing if no config saved
    });
}

// ============================
// Apply configuration received from popup.js
// ============================
function applyConfigFromPopup(config) {
    if (!config) return;
    themeConfig = { ...themeConfig, ...config };
    chrome.storage.sync.set(themeConfig, () => {
        applyCustomCSS();
    });
}

// ============================
// Listen for messages from popup.js
// ============================
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "updateTheme") {
        applyConfigFromPopup(msg.config);
    }
});

// ============================
// Utility Functions
// ============================
function randomHexColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function generateRandomColorsArray(n) {
    return Array.from({ length: n }, () => randomHexColor());
}

function randomGradientDirection() {
    return Math.floor(Math.random() * 360) + "deg";
}

function getTextColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 128 ? '#000000' : '#ffffff';
}

// ============================
// Generate Theme CSS
// ============================
function generateThemeCSS(config) {
    if (!config) return '';
    const isDark = detectThemeMode() === "dark";
    const count = config.colorCount || config.colors.length || 2;
    const colorsToUse = config.useRandomColors
        ? generateRandomColorsArray(count)
        : config.colors.slice(0, count);
    const direction = config.useRandomColors ? randomGradientDirection() : config.gradientDirection;
    const colorsStr = colorsToUse.join(", ");
    const mainColor = colorsToUse[0] || "#000000";

    const adjustColor = (hex, amount) => {
        let usePound = false;
        if (hex[0] === "#") { hex = hex.slice(1); usePound = true; }
        let num = parseInt(hex, 16);
        let r = Math.max(Math.min(255, (num >> 16) + amount), 0);
        let g = Math.max(Math.min(255, ((num >> 8) & 0x00FF) + amount), 0);
        let b = Math.max(Math.min(255, (num & 0x0000FF) + amount), 0);
        return (usePound ? "#" : "") + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
    };

    const darkVariant = adjustColor(mainColor, -35);
    const lightVariant = adjustColor(mainColor, 130);
    const darkTextColor = getTextColor(darkVariant);
    const lightTextColor = getTextColor(lightVariant);

    const baseColorAmount = isDark ? 70.4 : 15.2;
    const textColorAmount = isDark ? 30 : 40;

    return `
        .custom-theme-background {
            --custom-theme-background: linear-gradient(${direction}, ${colorsStr}) !important;
            --custom-background-gradient-chat-opacity-base-light: 0.95;
            --custom-background-gradient-highest-opacity-base-light: 1.0;
            --custom-background-gradient-opacity-mix-amount: 0.48;
            --custom-theme-border-color-amount: 5%;
            --custom-theme-base-color-amount: ${baseColorAmount}%;
            --custom-theme-text-color-amount: ${textColorAmount}%;
            --custom-theme-base-color-dark: ${darkVariant} !important;
            --custom-theme-base-color-dark-hsl: 0 100% 5% !important;
            --custom-theme-text-color-dark: ${darkTextColor} !important;
            --custom-theme-base-color-light: ${lightVariant} !important;
            --custom-theme-base-color-light-hsl: 0 100% 90% !important;
            --custom-theme-text-color-light: ${lightTextColor} !important;
        }
    `;
}

// ============================
// Apply CSS to the page
// ============================
function applyCustomCSS() {
    if (!themeConfig) return; // No config, do nothing
    const head = document.head || document.getElementsByTagName("head")[0];
    if (!head) return;

    // Remove previous custom styles
    document.querySelectorAll('style[data-client-themes]').forEach(s => s.remove());

    const style = document.createElement("style");
    style.setAttribute("data-client-themes", "true");
    style.textContent = generateThemeCSS(themeConfig);
    head.appendChild(style);

    document.documentElement.classList.add("custom-theme-background");
}

// ============================
// Mutation Observer to ensure CSS persists
// ============================
const observer = new MutationObserver(() => {
    const html = document.documentElement;
    const styleExists = document.querySelector('style[data-client-themes]');
    
    // Reapply CSS if style element or class is removed
    if (!html.classList.contains("custom-theme-background") || !styleExists) {
        applyCustomCSS();
    }
});

// Observe only class attribute changes
observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

// ============================
// Initialization
// ============================
loadSavedConfig();
