// ============================
// Popup Script for Discolors Extension
// Handles settings UI, storage, and communication with content script
// ============================

document.addEventListener("DOMContentLoaded", async () => {
    const versionSpan = document.getElementById("version");
    const status = document.getElementById("status");

    // Display current extension version
    const manifest = chrome.runtime.getManifest();
    versionSpan.textContent = manifest.version;

    // Check if update info is stored locally
    chrome.storage.local.get(['updateAvailable', 'latestVersion', 'latestUrl'], (data) => {
        if (data.updateAvailable) {
            status.innerHTML = `🆕 New version v${data.latestVersion} available! <a href="${data.latestUrl}" target="_blank">Click to update</a>`;
            status.style.color = "blue";
        } else {
            status.textContent = '';
        }
    });

    // Initialize popup inputs with saved config
    await populateInputs();
});

// ============================
// Utility: Retrieve stored configuration
// ============================
async function getStorageConfig() {
    return new Promise((resolve) => {
        try {
            chrome.storage.sync.get(null, (config) => {
                if (chrome.runtime.lastError) {
                    console.warn("Storage get error:", chrome.runtime.lastError);
                    resolve(null);
                } else {
                    resolve(Object.keys(config).length ? config : null);
                }
            });
        } catch (error) {
            console.warn("Could not access chrome.storage:", error);
            resolve(null);
        }
    });
}

// ============================
// Show/hide color inputs based on number of colors selected
// ============================
function updateColorInputsVisibility(count) {
    for (let i = 1; i <= 5; i++) {
        const input = document.getElementById(`color${i}`);
        if (input) input.style.display = i <= count ? "block" : "none";
    }
    updateGradientVisibility(count);
}

// ============================
// Show or hide gradient slider depending on color count
// ============================
function updateGradientVisibility(count) {
    const gradientInput = document.getElementById("gradientDirection");
    const directionValue = document.getElementById("directionValue");
    const gradientLabel = gradientInput?.previousElementSibling;

    if (count > 1) {
        if (gradientInput) gradientInput.style.display = "block";
        if (directionValue) directionValue.style.display = "block";
        if (gradientLabel) gradientLabel.style.display = "block";
    } else {
        if (gradientInput) gradientInput.style.display = "none";
        if (directionValue) directionValue.style.display = "none";
        if (gradientLabel) gradientLabel.style.display = "none";
    }
}

// ============================
// Populate popup inputs with saved config
// ============================
async function populateInputs() {
    const config = await getStorageConfig();
    if (!config) return;

    // Set color count
    const colorCountSelect = document.getElementById("colorCount");
    const count = parseInt(config.colorCount) || 1;
    if (colorCountSelect) colorCountSelect.value = count;

    // Set color inputs
    for (let i = 0; i < 5; i++) {
        const colorInput = document.getElementById(`color${i + 1}`);
        if (colorInput) {
            colorInput.value = config.colors?.[i] || "#000000";
            if (config.useRandomColors) colorInput.disabled = true;
        }
    }
    updateColorInputsVisibility(count);

    // Set gradient direction
    const gradientInput = document.getElementById("gradientDirection");
    const directionValue = document.getElementById("directionValue");
    if (gradientInput && directionValue && config.gradientDirection) {
        const deg = parseInt(config.gradientDirection) || 0;
        gradientInput.value = deg;
        directionValue.textContent = `${deg}°`;
        if (config.useRandomColors) gradientInput.disabled = true;
    }

    // Set random colors checkbox
    const randomCheckbox = document.getElementById("useRandomColors");
    if (randomCheckbox) randomCheckbox.checked = !!config.useRandomColors;
}

// ============================
// Save settings to Chrome storage
// ============================
async function saveSettings() {
    const colorCount = parseInt(document.getElementById("colorCount")?.value || 1, 10);

    const newConfig = {
        colorCount: colorCount,
        colors: [],
        gradientDirection: (document.getElementById("gradientDirection")?.value || "0") + "deg",
        useRandomColors: document.getElementById("useRandomColors")?.checked || false
    };

    for (let i = 0; i < colorCount; i++) {
        const colorInput = document.getElementById(`color${i + 1}`);
        if (colorInput) newConfig.colors.push(colorInput.value);
    }

    try {
        chrome.storage.sync.set(newConfig, () => {
            if (chrome.runtime.lastError) console.warn("Storage set error:", chrome.runtime.lastError);
            notifyContentScript(newConfig);
        });
    } catch (error) {
        console.warn("Error saving to storage:", error);
    }
}

// ============================
// Notify content script to update theme
// ============================
function notifyContentScript(config) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "updateTheme",
                config: config
            });
        }
    });
}

// ============================
// Compare versions X.X
// Returns true if latest is newer
// ============================
function isNewerVersion(current, latest) {
    const [curMajor, curMinor] = current.split('.').map(Number);
    const [latMajor, latMinor] = latest.split('.').map(Number);
    return latMajor > curMajor || (latMajor === curMajor && latMinor > curMinor);
}

// ============================
// Event listeners for popup interactions
// ============================
document.addEventListener("DOMContentLoaded", () => {
    populateInputs();

    // Update color inputs when color count changes
    document.getElementById("colorCount")?.addEventListener("change", (e) => {
        const count = parseInt(e.target.value, 10);
        updateColorInputsVisibility(count);
    });
});

// Save button
document.getElementById("saveBtn")?.addEventListener("click", saveSettings);

// Gradient slider live update
const gradientInput = document.getElementById("gradientDirection");
const directionValue = document.getElementById("directionValue");
if (gradientInput && directionValue) {
    gradientInput.addEventListener("input", () => {
        directionValue.textContent = `${gradientInput.value}°`;
    });
}

// Disable inputs when random colors is checked
const randomCheckbox = document.getElementById("useRandomColors");
if (randomCheckbox) {
    randomCheckbox.addEventListener("change", () => {
        const disabled = randomCheckbox.checked;
        for (let i = 0; i < 5; i++) {
            const colorInput = document.getElementById(`color${i + 1}`);
            if (colorInput) colorInput.disabled = disabled;
        }
        if (gradientInput) gradientInput.disabled = disabled;
        if (document.getElementById("colorCount")) document.getElementById("colorCount").disabled = disabled;
    });
}
