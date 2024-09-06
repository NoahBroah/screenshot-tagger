// Listener for commands such as capturing screenshots
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

// Listener for storage changes (optional, for debugging)
chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        console.log(
            `Storage key "${key}" in namespace "${namespace}" changed.`,
            `Old value was "${oldValue}", new value is "${newValue}".`
        );
    }
});

// Function to authenticate and get OAuth token
function getAuthToken(interactive) {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: interactive }, (token) => {
            if (chrome.runtime.lastError || !token) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(token);
            }
        });
    });
}

// Function to make an authorized API call to Google Docs API
function makeApiCall(token, docId, screenshot) {
    const apiUrl = `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`;
    
    const requestBody = {
        requests: [
            {
                insertInlineImage: {
                    location: { index: 1 },
                    uri: screenshot,
                    objectSize: {
                        height: { magnitude: 100, unit: 'PT' },
                        width: { magnitude: 100, unit: 'PT' }
                    }
                }
            }
        ]
    };

    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => response.json())
    .then(data => console.log('Screenshot inserted into Google Doc:', data))
    .catch(error => console.error('Error inserting screenshot:', error));
}

// Main function to initiate OAuth and make the API call with docId and screenshot
function authenticateAndInsertIntoDoc(docId, screenshot) {
    getAuthToken(true)
        .then(token => {
            console.log('Token:', token);
            makeApiCall(token, docId, screenshot);
        })
        .catch(error => {
            console.error('Auth Error:', error);
        });
}

// Listener for the popup.js message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "insertIntoGoogleDoc") {
        const { docId, screenshot } = message;
        authenticateAndInsertIntoDoc(docId, screenshot);
        sendResponse({ status: "success" });
    }
});

