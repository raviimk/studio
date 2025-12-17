/**
 * dataStore.js
 * 
 * This file abstracts all data persistence logic. It is designed to be
 * a single source of truth for reading and writing application data.
 *
 * ARCHITECTURE:
 * - By default, it uses an in-memory JavaScript object for storage.
 * - This design allows for easy replacement with a different backend,
 *   such as Node.js's `fs` module when running in an Electron environment,
 *   without changing any UI code.
 * - It avoids any browser-specific APIs like `window` or `localStorage`.
 * - It uses CommonJS `module.exports` to be compatible with Node.js/Electron.
 */


// In-memory store. This acts as our default "database".
let inMemoryStore = {
    sarinEntries: [],
    // Other data types will be added here
};

/**
 * Saves the provided data object to the data store.
 * @param {object} data The complete application data object to save.
 */
function saveData(data) {
    console.log('Saving data...');
    // In this simple version, we're just updating the in-memory object.
    // When this is run in Electron, this function will be modified
    // to write to a JSON file on the filesystem.
    if (data) {
        inMemoryStore = data;
    }
    console.log('Data saved successfully.');
}

/**
 * Loads and returns the entire data object from the data store.
 * @returns {object} The complete application data object.
 */
function loadData() {
    console.log('Loading data...');
    // In this version, we simply return the in-memory object.
    // In Electron, this would read from a JSON file.
    return inMemoryStore;
}

/**
 * Clears all data from the data store.
 */
function clearData() {
    console.log('Clearing all data...');
    // Reset the in-memory store to its initial empty state.
    // In Electron, this would delete or clear the content of the data file.
    inMemoryStore = {
        sarinEntries: [],
    };
    console.log('Data store cleared.');
}

// Export the functions for use in other parts of the application,
// using the CommonJS module system for future Electron compatibility.
module.exports = {
    saveData,
    loadData,
    clearData,
};
