chrome.commands.onCommand.addListener((command) => {
    if (command === "take_screenshot") {
        // Ensure the current tab is active and not in incognito mode
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (activeTab && !activeTab.incognito) {
                // Capture the visible area of the current tab
                chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error capturing screenshot: ", chrome.runtime.lastError.message);
                        return;
                    }

                    console.log("Screenshot captured", dataUrl);

                    // Store the screenshot in local storage
                    chrome.storage.local.set({ screenshot: dataUrl }, () => {
                        if (chrome.runtime.lastError) {
                            console.error("Error saving screenshot to storage: ", chrome.runtime.lastError.message);
                            return;
                        }

                        console.log('Screenshot saved to local storage');

                        // Notify the user that the screenshot was captured
                        chrome.notifications.create({
                            type: 'basic',
                            iconUrl: 'images/icon128.png',
                            title: 'Screenshot Captured',
                            message: 'Your screenshot has been captured and saved.'
                        }, (notificationId) => {
                            if (chrome.runtime.lastError) {
                                console.error("Error creating notification: ", chrome.runtime.lastError.message);
                                return;
                            }

                            console.log('Notification displayed with ID:', notificationId);

                            // Optionally open the popup to display the screenshot and provide options
                            chrome.action.openPopup();
                        });
                    });
                });
            } else {
                console.error("No active tab found or tab is in incognito mode");
            }
        });
    }
});

// Listener for storage changes to log any changes (optional, useful for debugging)
chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        console.log(
            `Storage key "${key}" in namespace "${namespace}" changed.`,
            `Old value was "${oldValue}", new value is "${newValue}".`
        );
    }
});

