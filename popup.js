// // Wait for the DOM to load before attaching event listeners
// document.addEventListener('DOMContentLoaded', function () {

//     chrome.storage.onChanged.addListener((changes, namespace) => {
//         for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
//             console.log(
//                 `Storage key "${key}" in namespace "${namespace}" changed.`,
//                 `Old value was "${oldValue}", new value is "${newValue}".`
//             );
//         }
//     });

//     // Search & Select Google Docs button click listener
//     document.getElementById('searchDocs').addEventListener('click', () => {
//         console.log("Search Docs button clicked");
//         const query = "'me' in owners";
//         listFiles(query, 'doc');
//     });

//     // Search & Select Google Sheets button click listener
//     document.getElementById('searchSheets').addEventListener('click', () => {
//         console.log("Search Sheets button clicked");
//         const query = "'me' in owners";
//         listFiles(query, 'sheet');
//     });

//     const docResults = document.getElementById('docResults');
//     const sheetResults = document.getElementById('sheetResults');
//     const screenshotContainer = document.createElement('div');
//     const insertButton = document.getElementById('insert');
//     const insertSheetButton = document.getElementById('insertSheet');

//     // Display the screenshot in the popup
//     chrome.storage.local.get('screenshot', (result) => {
//         if (result.screenshot) {
//             const img = document.createElement('img');
//             img.src = result.screenshot;
//             img.style.maxWidth = '100%';
//             img.style.marginTop = '10px';
//             screenshotContainer.appendChild(img);
//             document.body.insertBefore(screenshotContainer, document.body.firstChild);
//         } else {
//             console.error('No screenshot found in storage');
//         }
//     });

//     // Function to display search results
//     function displaySearchResults(files, type) {
//         const resultsContainer = type === 'doc' ? docResults : sheetResults;
//         resultsContainer.innerHTML = ''; // Clear previous results

//         files.forEach(file => {
//             const resultItem = document.createElement('div');
//             resultItem.className = 'result-item';
//             resultItem.textContent = file.name;

//             // When a file is clicked
//             resultItem.addEventListener('click', () => {
//                 console.log(`Selected file: ${file.name} with ID ${file.id}`);
//                 const selectedFileId = file.id;

//                 if (type === 'doc') {
//                     // Store selectedDocId in local storage
//                     chrome.storage.local.set({ selectedDocId: selectedFileId }, () => {
//                         console.log(`Selected document saved with ID: ${selectedFileId}`);
//                         chrome.storage.local.get('selectedDocId', (result) => {
//                             console.log("Retrieved selectedDocId from storage:", result.selectedDocId);
//                         });
//                         alert(`Selected document: ${file.name}`);
//                     });
//                 } else {
//                     // Store selectedSheetId in local storage
//                     chrome.storage.local.set({ selectedSheetId: selectedFileId }, () => {
//                         console.log(`Selected sheet saved with ID: ${selectedFileId}`);
//                         alert(`Selected sheet: ${file.name}`);
//                     });
//                 }

//                 resultsContainer.innerHTML = ''; // Clear results after selection
//             });

//             resultsContainer.appendChild(resultItem);
//         });
//     }

//     // Function to list files (Google Docs or Sheets)
//     async function listFiles(query, type) {
//         getAuthToken().then(token => {
//             const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,thumbnailLink)&pageSize=10`;
//             fetch(url, {
//                 headers: {
//                     'Authorization': 'Bearer ' + token
//                 }
//             }).then(response => response.json()).then(data => {
//                 console.log("API Response:", data);
//                 if (data.files && data.files.length > 0) {
//                     console.log("Files retrieved:", data.files);
//                     displaySearchResults(data.files, type);
//                 } else {
//                     console.log("No files found matching the query.");
//                 }
//             }).catch(error => {
//                 console.error("Error from Google API:", error);
//                 if (error.status === 401) {
//                     console.log('Token might be expired, invalidating and retrying...');
//                     invalidateAndGetAuthToken().then(newToken => {
//                         // Retry request with the new token
//                         fetch(url, {
//                             headers: {
//                                 'Authorization': 'Bearer ' + newToken
//                             }
//                         }).then(response => response.json()).then(data => {
//                             console.log("API Response after retry:", data);
//                             if (data.files && data.files.length > 0) {
//                                 displaySearchResults(data.files, type);
//                             } else {
//                                 console.log("No files found matching the query.");
//                             }
//                         }).catch(retryError => {
//                             console.error('Error after retrying with a new token:', retryError);
//                         });
//                     }).catch(invalidateError => {
//                         console.error('Failed to invalidate and refresh the token:', invalidateError);
//                     });
//                 }
//             });
//         }).catch(error => {
//             console.error('Failed to retrieve auth token:', error);
//         });
//     }
    

//     // Event listener for inserting into Google Doc
//     if (insertButton) {
//         insertButton.addEventListener('click', () => {
//             console.log("Insert into Google Doc button clicked");
    
//             // Retrieve the selected document ID and screenshot from storage
//             chrome.storage.local.get(['selectedDocId', 'screenshot'], (result) => {
//                 const docId = result.selectedDocId;
//                 const screenshot = result.screenshot;
                
//                 console.log("Retrieved docId:", docId);
//                 console.log("Retrieved screenshot:", screenshot);
    
//                 if (docId && screenshot) {
//                     console.log("Attempting to insert screenshot into Google Doc.");
    
//                     // Retrieve the OAuth token
//                     chrome.storage.local.get('authToken', (result) => {
//                         const token = result.authToken;
//                         console.log("Retrieved authToken:", token);
    
//                         if (token) {
//                             // Call the function to insert the screenshot
//                             insertIntoGoogleDoc(docId, screenshot, token);
//                         } else {
//                             console.error('No auth token found, please log in.');
//                         }
//                     });
//                 } else {
//                     alert('No document or screenshot selected. Please select a document and capture a screenshot first.');
//                 }
//             });
//         });
//     }

//     // Event listener for inserting into Google Sheet
//     if (insertSheetButton) {
//         insertSheetButton.addEventListener('click', () => {
//             console.log("Insert into Google Sheet button clicked");
//             chrome.storage.local.get('selectedSheetId', (result) => {
//                 const sheetId = result.selectedSheetId;
//                 if (sheetId) {
//                     console.log("Sheet ID found:", sheetId);
//                     const range = prompt('Enter the cell range (e.g., Sheet1!A1):');
//                     const values = [
//                         document.getElementById('tags').value,
//                         document.getElementById('notes').value
//                     ];
//                     if (range) {
//                         chrome.storage.local.get('screenshot', (result) => {
//                             if (result.screenshot) {
//                                 console.log("Screenshot found, inserting into Google Sheet");
//                                 insertIntoGoogleSheet(sheetId, range, values);
//                             }
//                         });
//                     }
//                 } else {
//                     alert('No sheet selected. Please select a sheet first.');
//                 }
//             });
//         });
//     }
// });

// // Function to get OAuth token
// function getAuthToken(interactive = true) {
//     return new Promise((resolve, reject) => {
//         chrome.identity.getAuthToken({ interactive: interactive }, (token) => {
//             if (chrome.runtime.lastError) {
//                 console.error('Error getting auth token:', chrome.runtime.lastError);
//                 reject(chrome.runtime.lastError);
//                 return;
//             }
//             if (token) {
//                 // Optionally invalidate and refresh the token if needed
//                 // Use chrome.identity.removeCachedAuthToken if necessary to invalidate.
//                 console.log('Valid OAuth token retrieved:', token);
//                 resolve(token);
//             } else {
//                 console.error('No token retrieved.');
//                 reject(new Error('No token retrieved.'));
//             }
//         });
//     });
// }

// function invalidateAndGetAuthToken() {
//     return new Promise((resolve, reject) => {
//         // First, remove the cached token
//         chrome.identity.getAuthToken({ interactive: false }, (token) => {
//             if (chrome.runtime.lastError || !token) {
//                 console.error('Error retrieving cached token for invalidation:', chrome.runtime.lastError || 'No token found');
//                 return reject('Failed to retrieve token');
//             }
//             chrome.identity.removeCachedAuthToken({ token }, () => {
//                 console.log('Cached token invalidated, fetching new token...');
//                 // Now fetch a new token
//                 getAuthToken().then(resolve).catch(reject);
//             });
//         });
//     });
// }


// // This function will be responsible for inserting text into the Google Doc
// function insertIntoGoogleDoc(docId, screenshotDataUrl, token) {
//     const url = `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`;
//     const requestBody = {
//         requests: [
//             {
//                 insertInlineImage: {
//                     location: {
//                         index: 1
//                     },
//                     uri: screenshotDataUrl,
//                     objectSize: {
//                         height: {
//                             magnitude: 100,
//                             unit: 'PT'
//                         },
//                         width: {
//                             magnitude: 100,
//                             unit: 'PT'
//                         }
//                     }
//                 }
//             }
//         ]
//     };

//     console.log("Sending POST request to Google Docs API with requestBody:", requestBody);
//     console.log("Using OAuth token:", token);

//     fetch(url, {
//         method: 'POST',
//         headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(requestBody)
//     }).then(response => response.json()).then(data => {
//         console.log('Screenshot inserted into Google Doc:', data);
//         if (data.error) {
//             console.error("Error inserting screenshot:", data.error);
//         } else {
//             alert('Screenshot inserted successfully!');
//         }
//     }).catch(error => {
//         console.error('Error inserting screenshot:', error);
//     });
// }


// // Function to insert data into Google Sheet
// async function insertIntoGoogleSheet(sheetId, range, values) {
//     try {
//         const token = await getAuthToken();
//         console.log("Inserting into Google Sheet with ID:", sheetId);

//         const requestBody = {
//             range: range,
//             majorDimension: "ROWS",
//             values: [values]
//         };

//         const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=RAW`, {
//             method: 'POST',
//             headers: new Headers({
//                 'Authorization': 'Bearer ' + token,
//                 'Content-Type': 'application/json'
//             }),
//             body: JSON.stringify(requestBody)
//         });

//         if (response.ok) {
//             console.log('Data inserted into Google Sheet!');
//             alert('Data inserted into Google Sheet!');
//         } else {
//             const errorResponse = await response.json();
//             console.error('Failed to insert data:', errorResponse);
//             alert('Failed to insert data.');
//         }
//     } catch (error) {
//         console.error('Error inserting data into Google Sheet:', error);
//     }
// }













//                    -------------  TESTING NEW CODE BELOW: -----------















// // Wait for the DOM to load before attaching event listeners
// document.addEventListener('DOMContentLoaded', function () {

//     chrome.storage.onChanged.addListener((changes, namespace) => {
//         for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
//             console.log(
//                 `Storage key "${key}" in namespace "${namespace}" changed.`,
//                 `Old value was "${oldValue}", new value is "${newValue}".`
//             );
//         }
//     });

//     // Search & Select Google Docs button click listener
//     document.getElementById('searchDocs').addEventListener('click', () => {
//         console.log("Search Docs button clicked");
//         const query = "'me' in owners";
//         listFiles(query, 'doc');
//     });

//     // Search & Select Google Sheets button click listener
//     document.getElementById('searchSheets').addEventListener('click', () => {
//         console.log("Search Sheets button clicked");
//         const query = "'me' in owners";
//         listFiles(query, 'sheet');
//     });

//     const docResults = document.getElementById('docResults');
//     const sheetResults = document.getElementById('sheetResults');
//     const screenshotContainer = document.createElement('div');
//     const insertButton = document.getElementById('insert');
//     const insertSheetButton = document.getElementById('insertSheet');

//     // Display the screenshot in the popup
    // chrome.storage.local.get('screenshot', (result) => {
    //     if (result.screenshot) {
    //         const img = document.createElement('img');
    //         img.src = result.screenshot;
    //         img.style.maxWidth = '100%';
    //         img.style.marginTop = '10px';
    //         screenshotContainer.appendChild(img);
    //         document.body.insertBefore(screenshotContainer, document.body.firstChild);
    //     } else {
    //         console.error('No screenshot found in storage');
    //     }
    // });

//     // Function to display search results
    // function displaySearchResults(files, type) {
    //     const resultsContainer = type === 'doc' ? docResults : sheetResults;
    //     resultsContainer.innerHTML = ''; // Clear previous results

    //     files.forEach(file => {
    //         const resultItem = document.createElement('div');
    //         resultItem.className = 'result-item';
    //         resultItem.textContent = file.name;

    //         // When a file is clicked
    //         resultItem.addEventListener('click', () => {
    //             console.log(`Selected file: ${file.name} with ID ${file.id}`);
    //             const selectedFileId = file.id;

    //             if (type === 'doc') {
    //                 // Store selectedDocId in local storage
    //                 chrome.storage.local.set({ selectedDocId: selectedFileId }, () => {
    //                     console.log(`Selected document saved with ID: ${selectedFileId}`);
    //                     chrome.storage.local.get('selectedDocId', (result) => {
    //                         console.log("Retrieved selectedDocId from storage:", result.selectedDocId);
    //                     });
    //                     alert(`Selected document: ${file.name}`);
    //                 });
    //             } else {
    //                 // Store selectedSheetId in local storage
    //                 chrome.storage.local.set({ selectedSheetId: selectedFileId }, () => {
    //                     console.log(`Selected sheet saved with ID: ${selectedFileId}`);
    //                     alert(`Selected sheet: ${file.name}`);
    //                 });
    //             }

    //             resultsContainer.innerHTML = ''; // Clear results after selection
    //         });

    //         resultsContainer.appendChild(resultItem);
    //     });
    // }

//     // Function to list files (Google Docs or Sheets)
//     async function listFiles(query, type) {
//         getAuthToken().then(token => {
//             const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,thumbnailLink)&pageSize=10`;
//             fetch(url, {
//                 headers: {
//                     'Authorization': 'Bearer ' + token
//                 }
//             }).then(response => response.json()).then(data => {
//                 console.log("API Response:", data);
//                 if (data.files && data.files.length > 0) {
//                     console.log("Files retrieved:", data.files);
//                     displaySearchResults(data.files, type);
//                 } else {
//                     console.log("No files found matching the query.");
//                 }
//             }).catch(error => {
//                 console.error("Error from Google API:", error);
//                 if (error.status === 401) {
//                     console.log('Token might be expired, invalidating and retrying...');
//                     invalidateAndGetAuthToken().then(newToken => {
//                         // Retry request with the new token
//                         fetch(url, {
//                             headers: {
//                                 'Authorization': 'Bearer ' + newToken
//                             }
//                         }).then(response => response.json()).then(data => {
//                             console.log("API Response after retry:", data);
//                             if (data.files && data.files.length > 0) {
//                                 displaySearchResults(data.files, type);
//                             } else {
//                                 console.log("No files found matching the query.");
//                             }
//                         }).catch(retryError => {
//                             console.error('Error after retrying with a new token:', retryError);
//                         });
//                     }).catch(invalidateError => {
//                         console.error('Failed to invalidate and refresh the token:', invalidateError);
//                     });
//                 }
//             });
//         }).catch(error => {
//             console.error('Failed to retrieve auth token:', error);
//         });
//     }

//     // Event listener for inserting into Google Doc
//     if (insertButton) {
//         insertButton.addEventListener('click', () => {
//             console.log("Insert into Google Doc button clicked");

//             // Retrieve the selected document ID and screenshot from storage
//             chrome.storage.local.get(['selectedDocId', 'screenshot'], (result) => {
//                 const docId = result.selectedDocId;
//                 const screenshot = result.screenshot;

//                 console.log("Retrieved docId:", docId);
//                 console.log("Retrieved screenshot:", screenshot);

//                 if (docId && screenshot) {
//                     console.log("Attempting to insert screenshot into Google Doc.");

//                     // Retrieve the OAuth token
//                     chrome.storage.local.get('authToken', (result) => {
//                         const token = result.authToken;
//                         console.log("Retrieved authToken:", token);

//                         if (token) {
//                             // Call the function to insert the screenshot
//                             insertIntoGoogleDoc(docId, screenshot, token);
//                         } else {
//                             console.error('No auth token found, please log in.');
//                         }
//                     });
//                 } else {
//                     alert('No document or screenshot selected. Please select a document and capture a screenshot first.');
//                 }
//             });
//         });
//     }

//     // Event listener for inserting into Google Sheet
//     if (insertSheetButton) {
//         insertSheetButton.addEventListener('click', () => {
//             console.log("Insert into Google Sheet button clicked");
//             chrome.storage.local.get('selectedSheetId', (result) => {
//                 const sheetId = result.selectedSheetId;
//                 if (sheetId) {
//                     console.log("Sheet ID found:", sheetId);
//                     const range = prompt('Enter the cell range (e.g., Sheet1!A1):');
//                     const values = [
//                         document.getElementById('tags').value,
//                         document.getElementById('notes').value
//                     ];
//                     if (range) {
//                         chrome.storage.local.get('screenshot', (result) => {
//                             if (result.screenshot) {
//                                 console.log("Screenshot found, inserting into Google Sheet");
//                                 insertIntoGoogleSheet(sheetId, range, values);
//                             }
//                         });
//                     }
//                 } else {
//                     alert('No sheet selected. Please select a sheet first.');
//                 }
//             });
//         });
//     }
// });

// // Function to get OAuth token
// function getAuthToken(interactive = true) {
//     return new Promise((resolve, reject) => {
//         chrome.identity.getAuthToken({ interactive: true }, (token) => {
//             if (chrome.runtime.lastError || !token) {
//                 console.error('Error getting auth token:', chrome.runtime.lastError);
//                 reject(chrome.runtime.lastError);
//                 return;
//             }
//             if (token) {
//                 // Optionally invalidate and refresh the token if needed
//                 console.log('Valid OAuth token retrieved:', token);
//                 resolve(token);
//             } else {
//                 console.error('No token retrieved.');
//                 reject(new Error('No token retrieved.'));
//             }
//         });
//     });
// }

// function invalidateAndGetAuthToken() {
//     return new Promise((resolve, reject) => {
//         // First, remove the cached token
//         chrome.identity.getAuthToken({ interactive: false }, (token) => {
//             if (chrome.runtime.lastError || !token) {
//                 console.error('Error retrieving cached token for invalidation:', chrome.runtime.lastError || 'No token found');
//                 return reject('Failed to retrieve token');
//             }
//             chrome.identity.removeCachedAuthToken({ token }, () => {
//                 console.log('Cached token invalidated, fetching new token...');
//                 // Now fetch a new token
//                 getAuthToken().then(resolve).catch(reject);
//             });
//         });
//     });
// }

// // This function will be responsible for inserting text into the Google Doc
// function insertIntoGoogleDoc(docId, screenshotDataUrl, token) {
//     const url = `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`;
//     const requestBody = {
//         "requests": [
//     {
//       "insertText": {
//         "location": {
//           "index": 1
//         },
//         "text": "Hello, World!"
//       }
//     }
//   ]
//     };

//     console.log("Sending POST request to Google Docs API with requestBody:", requestBody);
//     console.log("Using OAuth token:", token);

//     fetch(url, {
//         method: 'POST',
//         headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(requestBody)
//     }).then(response => response.json()).then(data => {
//         console.log('Screenshot inserted into Google Doc:', data);
//         if (data.error) {
//             console.error("Error inserting screenshot:", data.error);
//         } else {
//             alert('Screenshot inserted successfully!');
//         }
//     }).catch(error => {
//         console.error('Error inserting screenshot:', error);
//     });
// }

// // Function to insert data into Google Sheet
// async function insertIntoGoogleSheet(sheetId, range, values) {
//     try {
//         const token = await getAuthToken();
//         console.log("Inserting into Google Sheet with ID:", sheetId);

//         const requestBody = {
//             range: range,
//             majorDimension: "ROWS",
//             values: [values]
//         };

//         const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=RAW`, {
//             method: 'POST',
//             headers: new Headers({
//                 'Authorization': 'Bearer ' + token,
//                 'Content-Type': 'application/json'
//             }),
//             body: JSON.stringify(requestBody)
//         });

//         if (response.ok) {
//             console.log('Data inserted into Google Sheet!');
//             alert('Data inserted into Google Sheet!');
//         } else {
//             const errorResponse = await response.json();
//             console.error('Failed to insert data:', errorResponse);
//             alert('Failed to insert data.');
//         }
//     } catch (error) {
//         console.error('Error inserting data into Google Sheet:', error);
//     }
// }












//                    -------------  TESTING NEW CODE BELOW: -----------

// Just Google Docs, inserting image but not able to search and select (GET)








// Wait for the DOM to load before attaching event listeners
document.addEventListener('DOMContentLoaded', function () {
    // Search & Select Google Docs button click listener
    document.getElementById('searchDocs').addEventListener('click', () => {
        console.log("Search Docs button clicked");

        // Retrieve the OAuth token and then call listFiles
        chrome.identity.getAuthToken({ interactive: true }, function(token) {
            if (chrome.runtime.lastError || !token) {
                console.error('Error retrieving auth token:', chrome.runtime.lastError);
                alert('Failed to retrieve authentication token.');
            } else {
                console.log('Valid OAuth token retrieved:', token);
                listFiles(token, "mimeType='application/vnd.google-apps.document'", 'doc');
            }
        });
    });

    // Display the screenshot in an image element
    const screenshotContainer = document.createElement('div');
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

    // Insert into Google Doc button click listener
    const insertButton = document.getElementById('insert');
    if (insertButton) {
        insertButton.addEventListener('click', () => {
            console.log("Insert into Google Doc button clicked");

            chrome.storage.local.get(['selectedDocId', 'screenshot'], (result) => {
                const docId = result.selectedDocId;
                const screenshot = result.screenshot;

                if (docId && screenshot) {
                    console.log("Selected document found:", docId);
                    console.log("Screenshot found, inserting into Google Doc");

                    // Compress the screenshot before insertion
                    compressScreenshot(screenshot, 2).then(compressedScreenshot => {
                        // Send a message to background.js to handle the API call
                        chrome.runtime.sendMessage({
                            action: "insertIntoGoogleDoc",
                            docId: docId,
                            screenshot: compressedScreenshot
                        }, (response) => {
                            if (response.status === "success") {
                                console.log("Screenshot successfully inserted into the Google Doc.");
                            } else {
                                console.error("Failed to insert screenshot into Google Doc.");
                            }
                        });
                    }).catch(error => {
                        console.error("Error compressing the screenshot:", error);
                    });
                } else {
                    alert('No document or screenshot selected. Please select a document and capture a screenshot first.');
                }
            });
        });
    }
});

// Function to list files from Google Drive
function listFiles(token, query, type) {
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,thumbnailLink)&pageSize=10`;

    fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if (response.status === 401) {
            throw new Error('Unauthorized');
        }
        return response.json();
    })
    .then(data => {
        console.log("API Response:", data);
        if (data.files && data.files.length > 0) {
            displaySearchResults(data.files, type);
        } else {
            console.log("No files found matching the query.");
        }
    })
    .catch(error => {
        console.error("Error from Google API:", error);
        alert('Failed to list files. Please try again.');
    });
}

// Function to display search results
function displaySearchResults(files, type) {
    const resultsContainer = type === 'doc' ? document.getElementById('docResults') : document.getElementById('sheetResults');
    resultsContainer.innerHTML = ''; // Clear previous results

    files.forEach(file => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.textContent = file.name;

        resultItem.addEventListener('click', () => {
            console.log(`Selected file: ${file.name} with ID ${file.id}`);
            const selectedFileId = file.id;

            chrome.storage.local.set({ selectedDocId: selectedFileId }, () => {
                console.log(`Selected document saved with ID: ${selectedFileId}`);
                alert(`Selected document: ${file.name}`);
            });

            resultsContainer.innerHTML = ''; // Clear results after selection
        });

        resultsContainer.appendChild(resultItem);
    });
}

// Function to compress the screenshot
function compressScreenshot(imageDataUrl, maxSizeKB = 2) {
    console.log("Compression function start")
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = imageDataUrl;
        img.onload = () => {
            console.log(imageDataUrl)
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const scaleFactor = 150 / img.width;
            canvas.width = 150;
            canvas.height = img.height * scaleFactor;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            let quality = 0.7;
            let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            let fileSizeKB = compressedDataUrl.length * (3 / 4) / 1024;

            while (fileSizeKB > maxSizeKB && quality > 0.1) {
                quality -= 0.05;
                compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                fileSizeKB = compressedDataUrl.length * (3 / 4) / 1024;
            }

            if (fileSizeKB <= maxSizeKB) {
                resolve(compressedDataUrl);
            } else {
                reject(new Error(`Unable to compress image below ${maxSizeKB}KB`));
            }
        };

        img.onerror = (error) => reject(error);
    });
}

