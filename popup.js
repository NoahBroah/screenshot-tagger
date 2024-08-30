document.addEventListener('DOMContentLoaded', () => {
    const docResults = document.getElementById('docResults');
    const sheetResults = document.getElementById('sheetResults');
    const screenshotContainer = document.createElement('div');
    const insertButton = document.getElementById('insert');
    
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

    // Set up the search buttons to fetch Google Docs and Sheets
    const searchDocsButton = document.getElementById('searchDocs');
    const searchSheetsButton = document.getElementById('searchSheets');

    if (searchDocsButton) {
        searchDocsButton.addEventListener('click', () => {
            listFiles("mimeType='application/vnd.google-apps.document'", 'doc');
        });
    }

    if (searchSheetsButton) {
        searchSheetsButton.addEventListener('click', () => {
            listFiles("mimeType='application/vnd.google-apps.spreadsheet'", 'sheet');
        });
    }

    // Function to display search results
    function displaySearchResults(files, type) {
        const resultsContainer = type === 'doc' ? docResults : sheetResults;
        resultsContainer.innerHTML = ''; // Clear previous results

        files.forEach(file => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.textContent = file.name;
            resultItem.addEventListener('click', () => {
                const selectedFileId = file.id;
                if (type === 'doc') {
                    chrome.storage.local.set({ selectedDocId: selectedFileId }, () => {
                        alert(`Selected document saved: ${file.name}`);
                    });
                } else {
                    chrome.storage.local.set({ selectedSheetId: selectedFileId }, () => {
                        alert(`Selected sheet saved: ${file.name}`);
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
            const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,thumbnailLink)&pageSize=10`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const files = await response.json();
            displaySearchResults(files.files, type);
        } catch (error) {
            console.error('Error listing files:', error);
        }
    }

    // Ensure the buttons are enabled and clickable
    const insertSheetButton = document.getElementById('insertSheet');

    if (insertButton) {
        insertButton.addEventListener('click', () => {
            chrome.storage.local.get('selectedDocId', (result) => {
                const docId = result.selectedDocId;
                if (docId) {
                    chrome.storage.local.get('screenshot', (result) => {
                        if (result.screenshot) {
                            insertIntoGoogleDoc(docId, result.screenshot);
                        }
                    }).catch(error => console.error('Error getting screenshot:', error));
                } else {
                    alert('No document selected. Please select a document first.');
                }
            }).catch(error => console.error('Error getting document ID:', error));
        });
    }

    if (insertSheetButton) {
        insertSheetButton.addEventListener('click', () => {
            chrome.storage.local.get('selectedSheetId', (result) => {
                const sheetId = result.selectedSheetId;
                if (sheetId) {
                    const range = prompt('Enter the cell range (e.g., Sheet1!A1):');
                    const values = [
                        document.getElementById('tags').value,
                        document.getElementById('notes').value
                    ];
                    if (range) {
                        chrome.storage.local.get('screenshot', (result) => {
                            if (result.screenshot) {
                                insertIntoGoogleSheet(sheetId, range, values);
                            }
                        }).catch(error => console.error('Error getting screenshot:', error));
                    }
                } else {
                    alert('No sheet selected. Please select a sheet first.');
                }
            }).catch(error => console.error('Error getting sheet ID:', error));
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

// Function to insert screenshot into Google Doc
async function insertIntoGoogleDoc(docId, dataUrl) {
    try {
        const token = await getAuthToken();
        const requests = [
            {
                insertInlineImage: {
                    location: {
                        index: 1  // Change the index to the desired position in the document
                    },
                    uri: dataUrl,
                    objectSize: {
                        height: {
                            magnitude: 500,
                            unit: 'PT'
                        },
                        width: {
                            magnitude: 500,
                            unit: 'PT'
                        }
                    }
                }
            }
        ];

        const response = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
            method: 'POST',
            headers: new Headers({
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify({ requests })
        });

        if (response.ok) {
            console.log('Screenshot inserted into Google Doc!');
            alert('Screenshot inserted into Google Doc!');
        } else {
            const errorResponse = await response.json();
            console.error('Failed to insert screenshot:', errorResponse);
            alert('Failed to insert screenshot.');
        }
    } catch (error) {
        console.error('Error inserting screenshot into Google Doc:', error);
    }
}


// Function to insert data into Google Sheet
async function insertIntoGoogleSheet(sheetId, range, values) {
    try {
        const token = await getAuthToken();

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










// document.addEventListener('DOMContentLoaded', () => {

//     // Ensure all elements exist before adding event listeners
//     const downloadButton = document.getElementById('download');
//     const insertButton = document.getElementById('insert');
//     const insertSheetButton = document.getElementById('insertSheet');

//     if (downloadButton) {
//         downloadButton.addEventListener('click', () => {
//             chrome.storage.local.get(['screenshot'], (result) => {
//                 if (result.screenshot) {
//                     saveScreenshot(result.screenshot);
//                 }
//             });
//         });
//     }

//     if (insertButton) {
//         insertButton.addEventListener('click', async () => {
//             const docId = prompt('Enter the Google Doc ID:');
//             if (docId) {
//                 chrome.storage.local.get(['screenshot'], (result) => {
//                     if (result.screenshot) {
//                         insertIntoGoogleDoc(docId, result.screenshot);
//                     }
//                 });
//             }
//         });
//     }

//     if (insertSheetButton) {
//         insertSheetButton.addEventListener('click', async () => {
//             const sheetId = prompt('Enter the Google Sheet ID:');
//             const range = prompt('Enter the cell range (e.g., Sheet1!A1):');
//             const values = [document.getElementById('tags').value, document.getElementById('notes').value];
//             if (sheetId && range) {
//                 chrome.storage.local.get(['screenshot'], (result) => {
//                     if (result.screenshot) {
//                         insertIntoGoogleSheet(sheetId, range, values);
//                     }
//                 });
//             }
//         });
//     }
//     // Load the screenshot from local storage and display it in the popup
//     chrome.storage.local.get(['screenshot'], (result) => {
//         if (result.screenshot) {
//             const img = document.createElement('img');
//             img.src = result.screenshot;
//             img.style.maxWidth = '100%';
//             document.body.appendChild(img);

//             // Enable download button
//             document.getElementById('download').addEventListener('click', () => {
//                 const link = document.createElement('a');
//                 link.href = result.screenshot;
//                 link.download = 'screenshot.png';
//                 link.click();
//             });

//             // Insert into Google Doc
//             document.getElementById('insert').addEventListener('click', async () => {
//                 const docId = prompt('Enter the Google Doc ID:');
//                 if (docId) {
//                     await insertIntoGoogleDoc(docId, result.screenshot);
//                 }
//             });

//             // Insert into Google Sheet
//             document.getElementById('insertSheet').addEventListener('click', async () => {
//                 const sheetId = prompt('Enter the Google Sheet ID:');
//                 const range = prompt('Enter the cell range (e.g., Sheet1!A1):');
//                 const values = [document.getElementById('tags').value, document.getElementById('notes').value];
//                 if (sheetId && range) {
//                     await insertIntoGoogleSheet(sheetId, range, values);
//                 }
//             });

//             // Save screenshot to a selected directory
//             document.getElementById('saveToDir').addEventListener('click', () => {
//                 saveScreenshotToDir(result.screenshot);
//             });
//         }
//     });

//     // Handle saving tags and notes
//     document.getElementById('save').addEventListener('click', () => {
//         const tags = document.getElementById('tags').value;
//         const notes = document.getElementById('notes').value;

//         chrome.storage.local.get(['screenshot'], (result) => {
//             if (result.screenshot) {
//                 console.log('Tags:', tags);
//                 console.log('Notes:', notes);
//                 console.log('Screenshot Data URL:', result.screenshot);

//                 chrome.storage.local.remove('screenshot', () => {
//                     console.log('Screenshot cleared from storage');
//                 });
//             }
//         });

//         alert('Screenshot with tags and notes saved!');
//     });

//     // Search and select Google Docs
//     document.getElementById('searchDocs').addEventListener('click', async () => {
//         const query = prompt('Enter document name:');
//         const files = await listFiles(`name contains '${query}' and mimeType='application/vnd.google-apps.document'`);
//         displayFileOptions(files, 'doc');
//     });

//     // Search and select Google Sheets
//     document.getElementById('searchSheets').addEventListener('click', async () => {
//         const query = prompt('Enter sheet name:');
//         const files = await listFiles(`name contains '${query}' and mimeType='application/vnd.google-apps.spreadsheet'`);
//         displayFileOptions(files, 'sheet');
//     });

//     // Save selected document as default
//     document.getElementById('saveDocAsDefault').addEventListener('click', () => {
//         const docId = document.getElementById('docSelect').value;
//         chrome.storage.local.set({ defaultDocId: docId }, () => {
//             alert('Default document saved!');
//         });
//     });

//     // Save selected sheet as default
//     document.getElementById('saveSheetAsDefault').addEventListener('click', () => {
//         const sheetId = document.getElementById('sheetSelect').value;
//         chrome.storage.local.set({ defaultSheetId: sheetId }, () => {
//             alert('Default sheet saved!');
//         });
//     });

//     // Insert into default document
//     document.getElementById('insertIntoDefaultDoc').addEventListener('click', async () => {
//         await insertIntoDefaultDoc();
//     });

//     // Insert into default sheet
//     document.getElementById('insertIntoDefaultSheet').addEventListener('click', async () => {
//         await insertIntoDefaultSheet();
//     });

//     // Choose a directory to save screenshots
//     document.getElementById('chooseDir').addEventListener('click', () => {
//         chrome.fileSystem.chooseEntry({type: 'openDirectory'}, (entry) => {
//             if (entry) {
//                 chrome.storage.local.set({ saveDir: chrome.fileSystem.retainEntry(entry) });
//                 alert('Directory selected!');
//             }
//         });
//     });
// });

// // Helper function to list files in Google Drive
// async function listFiles(query) {
//     const token = await getAuthToken();
//     const result = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, {
//         method: 'GET',
//         headers: new Headers({
//             'Authorization': 'Bearer ' + token
//         })
//     });

//     const files = await result.json();
//     return files.files;
// }

// // Helper function to display file options in a dropdown
// function displayFileOptions(files, type) {
//     const select = document.createElement('select');
//     select.id = type === 'doc' ? 'docSelect' : 'sheetSelect';

//     files.forEach(file => {
//         const option = document.createElement('option');
//         option.value = file.id;
//         option.text = file.name;
//         select.appendChild(option);
//     });

//     document.body.appendChild(select);
// }

// // Insert into Google Doc
// async function insertIntoGoogleDoc(docId, dataUrl) {
//     const token = await getAuthToken();
//     const requests = [
//         {
//             insertInlineImage: {
//                 location: {
//                     index: 1  // Change the index to the desired position in the document
//                 },
//                 uri: dataUrl,
//                 objectSize: {
//                     height: {
//                         magnitude: 500,
//                         unit: 'PT'
//                     },
//                     width: {
//                         magnitude: 500,
//                         unit: 'PT'
//                     }
//                 }
//             }
//         }
//     ];

//     const result = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
//         method: 'POST',
//         headers: new Headers({
//             'Authorization': 'Bearer ' + token,
//             'Content-Type': 'application/json'
//         }),
//         body: JSON.stringify({ requests })
//     });

//     if (result.ok) {
//         alert('Screenshot inserted into Google Doc!');
//     } else {
//         alert('Failed to insert screenshot.');
//     }
// }

// // Insert into Google Sheet
// async function insertIntoGoogleSheet(sheetId, range, values) {
//     const token = await getAuthToken();

//     const requestBody = {
//         range: range,
//         majorDimension: "ROWS",
//         values: [values]
//     };

//     const result = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=RAW`, {
//         method: 'POST',
//         headers: new Headers({
//             'Authorization': 'Bearer ' + token,
//             'Content-Type': 'application/json'
//         }),
//         body: JSON.stringify(requestBody)
//     });

//     if (result.ok) {
//         alert('Data inserted into Google Sheet!');
//     } else {
//         alert('Failed to insert data.');
//     }
// }

// // Get OAuth token
// async function getAuthToken() {
//     return new Promise((resolve, reject) => {
//         chrome.identity.getAuthToken({ interactive: true }, (token) => {
//             if (chrome.runtime.lastError || !token) {
//                 reject(chrome.runtime.lastError || new Error("No token found"));
//                 return;
//             }
//             resolve(token);
//         });
//     });
// }

// // Save screenshot to selected directory
// function saveScreenshot(dataUrl) {
//     chrome.downloads.download({
//         url: dataUrl,
//         filename: 'screenshot.png',
//         saveAs: true // This prompts the user with the Save As dialog
//     }, (downloadId) => {
//         if (chrome.runtime.lastError) {
//             console.error("Error downloading the screenshot: ", chrome.runtime.lastError.message);
//         } else {
//             console.log("Screenshot saved with download ID:", downloadId);
//         }
//     });
// }


// // Convert data URL to Blob
// function dataURLToBlob(dataUrl) {
//     const arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)[1],
//           bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
//     while(n--){
//         u8arr[n] = bstr.charCodeAt(n);
//     }
//     return new Blob([u8arr], {type:mime});
// }

// // Insert into default document
// async function insertIntoDefaultDoc() {
//     chrome.storage.local.get(['defaultDocId', 'screenshot'], (result) => {
//         if (result.screenshot && result.defaultDocId) {
//             insertIntoGoogleDoc(result.defaultDocId, result.screenshot);
//         }
//     });
// }

// // Insert into default sheet
// async function insertIntoDefaultSheet() {
//     chrome.storage.local.get(['defaultSheetId', 'screenshot'], (result) => {
//         if (result.screenshot && result.defaultSheetId) {
//             const range = prompt('Enter the cell range (e.g., Sheet1!A1):');
//             const values = [document.getElementById('tags').value, document.getElementById('notes').value];
//             insertIntoGoogleSheet(result.defaultSheetId, range, values);
//         }
//     });
// }

// // Convert data URL to Blob
// function dataURLToBlob(dataUrl) {
//     const arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)[1],
//           bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
//     while(n--){
//         u8arr[n] = bstr.charCodeAt(n);
//     }
//     return new Blob([u8arr], {type:mime});
// }

// // Save screenshot to selected directory
// function saveScreenshotToDir(dataUrl) {
//     chrome.storage.local.get('saveDir', (items) => {
//         if (items.saveDir) {
//             chrome.fileSystem.restoreEntry(items.saveDir, (entry) => {
//                 if (entry) {
//                     entry.getFile('screenshot.png', {create: true}, (fileEntry) => {
//                         fileEntry.createWriter((fileWriter) => {
//                             fileWriter.onwriteend = () => {
//                                 alert('Screenshot saved!');
//                             };
//                             fileWriter.onerror = (e) => {
//                                 console.error('Write failed: ' + e.toString());
//                             };

//                             const blob = dataURLToBlob(dataUrl);
//                             fileWriter.write(blob);
//                         });
//                     });
//                 }
//             });
//         }
//     });
// }

// // Helper function to list files in Google Drive
// async function listFiles(query) {
//     const token = await getAuthToken();
//     const result = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, {
//         method: 'GET',
//         headers: new Headers({
//             'Authorization': 'Bearer ' + token
//         })
//     });

//     const files = await result.json();
//     return files.files;
// }

// // Helper function to display file options in a dropdown
// function displayFileOptions(files, type) {
//     const select = document.createElement('select');
//     select.id = type === 'doc' ? 'docSelect' : 'sheetSelect';

//     files.forEach(file => {
//         const option = document.createElement('option');
//         option.value = file.id;
//         option.text = file.name;
//         select.appendChild(option);
//     });

//     document.body.appendChild(select);
// }

// // Insert into Google Doc
// async function insertIntoGoogleDoc(docId, dataUrl) {
//     const token = await getAuthToken();
//     const requests = [
//         {
//             insertInlineImage: {
//                 location: {
//                     index: 1  // Change the index to the desired position in the document
//                 },
//                 uri: dataUrl,
//                 objectSize: {
//                     height: {
//                         magnitude: 500,
//                         unit: 'PT'
//                     },
//                     width: {
//                         magnitude: 500,
//                         unit: 'PT'
//                     }
//                 }
//             }
//         }
//     ];

//     const result = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
//         method: 'POST',
//         headers: new Headers({
//             'Authorization': 'Bearer ' + token,
//             'Content-Type': 'application/json'
//         }),
//         body: JSON.stringify({ requests })
//     });

//     if (result.ok) {
//         alert('Screenshot inserted into Google Doc!');
//     } else {
//         alert('Failed to insert screenshot.');
//     }
// }

// // Insert into Google Sheet
// async function insertIntoGoogleSheet(sheetId, range, values) {
//     const token = await getAuthToken();

//     const requestBody = {
//         range: range,
//         majorDimension: "ROWS",
//         values: [values]
//     };

//     const result = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=RAW`, {
//         method: 'POST',
//         headers: new Headers({
//             'Authorization': 'Bearer ' + token,
//             'Content-Type': 'application/json'
//         }),
//         body: JSON.stringify(requestBody)
//     });

//     if (result.ok) {
//         alert('Data inserted into Google Sheet!');
//     } else {
//         alert('Failed to insert data.');
//     }
// }

// // Get OAuth token
// async function getAuthToken() {
//     return new Promise((resolve, reject) => {
//         chrome.identity.getAuthToken({ interactive: true }, (token) => {
//             if (chrome.runtime.lastError || !token) {
//                 reject(chrome.runtime.lastError || new Error("No token found"));
//                 return;
//             }
//             resolve(token);
//         });
//     });
// }


