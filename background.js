// ============================
// Background Script for Discolors Extension
// Automatically checks for updates
// ============================

const CHECK_INTERVAL_MINUTES = 60; // Interval for update checks (in minutes)

// Call update check on background start
checkForUpdate();

// Create a daily alarm when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create("checkUpdate", { periodInMinutes: CHECK_INTERVAL_MINUTES });
});

// Listen to alarms
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "checkUpdate") checkForUpdate();
});

// ============================
// Main function to check for updates
// ============================
async function checkForUpdate() {
    try {
        const manifest = chrome.runtime.getManifest();
        const currentVersion = manifest.version;

        // Fetch the latest release from GitHub
        const response = await fetch("https://api.github.com/repos/uictorius/Discolors/releases/latest");

        if (!response.ok) {
            console.log("No release found or request error:", response.status);
            chrome.storage.local.set({ updateAvailable: false });
            chrome.action.setBadgeText({ text: '' });
            return;
        }

        const data = await response.json();

        if (!data.tag_name) {
            console.log("No release tag found.");
            chrome.storage.local.set({ updateAvailable: false });
            chrome.action.setBadgeText({ text: '' });
            return;
        }

        const latestVersion = data.tag_name.replace(/^v/, '');
        const updateAvailable = isNewerVersion(currentVersion, latestVersion);

        // Save update info in local storage
        await chrome.storage.local.set({
            updateAvailable,
            latestVersion,
            latestUrl: data.html_url
        });

        // Update the extension badge
        if (updateAvailable) {
            chrome.action.setBadgeText({ text: 'NEW' });
            chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
        } else {
            chrome.action.setBadgeText({ text: '' });
        }

    } catch (error) {
        console.warn("Error checking for update:", error);
        chrome.storage.local.set({ updateAvailable: false });
        chrome.action.setBadgeText({ text: '' });
    }
}

// ============================
// Compare versions (format X.X)
// Returns true if latest version is newer than current
// ============================
function isNewerVersion(current, latest) {
    const [curMajor, curMinor] = current.split('.').map(Number);
    const [latMajor, latMinor] = latest.split('.').map(Number);
    return latMajor > curMajor || (latMajor === curMajor && latMinor > curMinor);
}
