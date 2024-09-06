// Wait for the DOM to load before attaching event listeners
document.addEventListener('DOMContentLoaded', function () {

    chrome.storage.onChanged.addListener((changes, namespace) => {
        for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
            console.log(
                `Storage key "${key}" in namespace "${namespace}" changed.`,
                `Old value was "${oldValue}", new value is "${newValue}".`
            );
        }
    });

    // Search & Select Google Docs button click listener
    document.getElementById('searchDocs').addEventListener('click', () => {
        console.log("Search Docs button clicked");
        const query = "'me' in owners";
        listFiles(query, 'doc');
    });

    // Search & Select Google Sheets button click listener
    document.getElementById('searchSheets').addEventListener('click', () => {
        console.log("Search Sheets button clicked");
        const query = "'me' in owners";
        listFiles(query, 'sheet');
    });

    const docResults = document.getElementById('docResults');
    const sheetResults = document.getElementById('sheetResults');
    const screenshotContainer = document.createElement('div');
    const insertButton = document.getElementById('insert');
    const insertSheetButton = document.getElementById('insertSheet');

    // Display the screenshot in the popup
    chrome.storage.local.get('screenshot', (result) => {
        if (result.screenshot) {
            const img = document.createElement('img');
            img.src = result.screenshot;
            img.style.maxWidth = '100%';
            img.style.marginTop = '10px';
            screenshotContainer.appendChild(img);
            document.body.insertBefore(screenshotContainer, document.body.firstChild);
        } else {
            console.error('No screenshot found in storage');
        }
    });

    // Function to display search results
    function displaySearchResults(files, type) {
        const resultsContainer = type === 'doc' ? docResults : sheetResults;
        resultsContainer.innerHTML = ''; // Clear previous results

        files.forEach(file => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.textContent = file.name;

            // When a file is clicked
            resultItem.addEventListener('click', () => {
                console.log(`Selected file: ${file.name} with ID ${file.id}`);
                const selectedFileId = file.id;

                if (type === 'doc') {
                    // Store selectedDocId in local storage
                    chrome.storage.local.set({ selectedDocId: selectedFileId }, () => {
                        console.log(`Selected document saved with ID: ${selectedFileId}`);
                        chrome.storage.local.get('selectedDocId', (result) => {
                            console.log("Retrieved selectedDocId from storage:", result.selectedDocId);
                        });
                        alert(`Selected document: ${file.name}`);
                    });
                } else {
                    // Store selectedSheetId in local storage
                    chrome.storage.local.set({ selectedSheetId: selectedFileId }, () => {
                        console.log(`Selected sheet saved with ID: ${selectedFileId}`);
                        alert(`Selected sheet: ${file.name}`);
                    });
                }

                resultsContainer.innerHTML = ''; // Clear results after selection
            });

            resultsContainer.appendChild(resultItem);
        });
    }

    // Function to list files (Google Docs or Sheets)
    async function listFiles(query, type) {
        try {
            const token = await getAuthToken();
            console.log("Auth token retrieved:", token);

            // Use the correct query format
            console.log("Query:", query);

            // Fetch files from Google Drive
            const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,thumbnailLink)&pageSize=10`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Error from Google API:', data.error);
                alert(`Google API Error: ${data.error.message}`);
                return;
            }

            console.log("Full API Response:", data);

            if (data.files && data.files.length > 0) {
                console.log("Files retrieved:", data.files);
                displaySearchResults(data.files, type);
            } else {
                console.log("No files found matching the query.");
                alert('No files found. Please try a different query.');
            }
        } catch (error) {
            console.error('Error listing files:', error);
            alert('Error retrieving files. Check the console for more details.');
        }
    }

    // Event listener for inserting into Google Doc
    if (insertButton) {
        insertButton.addEventListener('click', () => {
            console.log("Insert into Google Doc button clicked");
    
            // Retrieve the selected document ID and screenshot from storage
            chrome.storage.local.get(['selectedDocId', 'screenshot'], (result) => {
                const docId = result.selectedDocId;
                const screenshot = result.screenshot;
                
                console.log("Retrieved docId:", docId);
                console.log("Retrieved screenshot:", screenshot);
    
                if (docId && screenshot) {
                    console.log("Attempting to insert screenshot into Google Doc.");
    
                    // Retrieve the OAuth token
                    chrome.storage.local.get('authToken', (result) => {
                        const token = result.authToken;
                        console.log("Retrieved authToken:", token);
    
                        if (token) {
                            // Call the function to insert the screenshot
                            insertIntoGoogleDoc(docId, screenshot, token);
                        } else {
                            console.error('No auth token found, please log in.');
                        }
                    });
                } else {
                    alert('No document or screenshot selected. Please select a document and capture a screenshot first.');
                }
            });
        });
    }

    // Event listener for inserting into Google Sheet
    if (insertSheetButton) {
        insertSheetButton.addEventListener('click', () => {
            console.log("Insert into Google Sheet button clicked");
            chrome.storage.local.get('selectedSheetId', (result) => {
                const sheetId = result.selectedSheetId;
                if (sheetId) {
                    console.log("Sheet ID found:", sheetId);
                    const range = prompt('Enter the cell range (e.g., Sheet1!A1):');
                    const values = [
                        document.getElementById('tags').value,
                        document.getElementById('notes').value
                    ];
                    if (range) {
                        chrome.storage.local.get('screenshot', (result) => {
                            if (result.screenshot) {
                                console.log("Screenshot found, inserting into Google Sheet");
                                insertIntoGoogleSheet(sheetId, range, values);
                            }
                        });
                    }
                } else {
                    alert('No sheet selected. Please select a sheet first.');
                }
            });
        });
    }
});

// Function to get OAuth token
async function getAuthToken() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError || !token) {
                console.error('Error getting auth token:', chrome.runtime.lastError ? chrome.runtime.lastError.message : 'No token returned');
                reject(chrome.runtime.lastError || new Error("No token found"));
            } else {
                resolve(token);
            }
        });
    });
}

// This function will be responsible for inserting text into the Google Doc
function insertIntoGoogleDoc(docId, screenshotDataUrl, token) {
    console.log("Inserting screenshot into doc with ID:", docId);

    const url = `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`;
    const requestBody = {
        requests: [
            {
                insertInlineImage: {
                    location: {
                        index: 1 // Insert at the beginning of the document
                    },
                    uri: screenshotDataUrl, // The screenshot data in base64 format
                    objectSize: {
                        height: {
                            magnitude: 100,
                            unit: 'PT'
                        },
                        width: {
                            magnitude: 100,
                            unit: 'PT'
                        }
                    }
                }
            }
        ]
    };

    console.log("Sending POST request to Google Docs API with requestBody:", requestBody);

    fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    }).then(response => response.json()).then(data => {
        console.log('Screenshot inserted into Google Doc:', data);
        alert('Screenshot inserted successfully!');
    }).catch(error => {
        console.error('Error inserting screenshot:', error);
    });
}

// Function to insert data into Google Sheet
async function insertIntoGoogleSheet(sheetId, range, values) {
    try {
        const token = await getAuthToken();
        console.log("Inserting into Google Sheet with ID:", sheetId);

        const requestBody = {
            range: range,
            majorDimension: "ROWS",
            values: [values]
        };

        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=RAW`, {
            method: 'POST',
            headers: new Headers({
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            console.log('Data inserted into Google Sheet!');
            alert('Data inserted into Google Sheet!');
        } else {
            const errorResponse = await response.json();
            console.error('Failed to insert data:', errorResponse);
            alert('Failed to insert data.');
        }
    } catch (error) {
        console.error('Error inserting data into Google Sheet:', error);
    }
}
