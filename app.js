/**
 * app.js
 * 
 * This file contains all the UI logic for the Gem Tracker application.
 * It is responsible for handling user interactions, rendering data,
 * and communicating with the data layer (dataStore.js).
 * It does NOT contain any direct data storage or manipulation logic.
 */

// Since this is prepared for a CommonJS environment, we use `require`.
const { saveData, loadData, clearData } = require('./dataStore.js');

document.addEventListener('DOMContentLoaded', () => {
    // UI Element References
    const sarinForm = document.getElementById('sarin-form');
    const entriesList = document.getElementById('entries-list');
    const clearDataBtn = document.getElementById('clear-data-btn');

    // --- Functions ---

    /**
     * Renders the list of entries to the UI.
     */
    function renderEntries() {
        const data = loadData();
        entriesList.innerHTML = ''; // Clear the list first

        if (!data || !data.sarinEntries || data.sarinEntries.length === 0) {
            entriesList.innerHTML = '<li>No entries yet.</li>';
            return;
        }

        data.sarinEntries.forEach(entry => {
            const li = document.createElement('li');
            li.textContent = `Kapan: ${entry.kapan}, Lot: ${entry.lot}, Packets: ${entry.packets} (Added: ${new Date(entry.timestamp).toLocaleString()})`;
            entriesList.appendChild(li);
        });
    }

    /**
     * Handles the submission of the Sarin packet entry form.
     * @param {Event} e - The form submission event.
     */
    function handleSarinSubmit(e) {
        e.preventDefault();

        const kapan = document.getElementById('sarin-kapan').value;
        const lot = document.getElementById('sarin-lot').value;
        const packets = document.getElementById('sarin-packets').value;

        if (!kapan || !lot || !packets) {
            alert('Please fill out all fields.');
            return;
        }
        
        // Load existing data
        const currentData = loadData() || { sarinEntries: [] };

        // Prepare new entry
        const newEntry = {
            id: `sarin-${Date.now()}`,
            kapan,
            lot,
            packets: parseInt(packets, 10),
            timestamp: new Date().toISOString(),
        };

        // Add to the data and save
        currentData.sarinEntries.push(newEntry);
        saveData(currentData);

        // Re-render and clear form
        renderEntries();
        sarinForm.reset();
        document.getElementById('sarin-kapan').focus();
    }

    /**
     * Handles the click event for clearing all data.
     */
    function handleClearData() {
        if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
            clearData();
            renderEntries();
            console.log('All data cleared.');
        }
    }


    // --- Event Listeners ---
    sarinForm.addEventListener('submit', handleSarinSubmit);
    clearDataBtn.addEventListener('click', handleClearData);


    // --- Initial Load ---
    console.log('Application UI initialized.');
    // Initially, we'll simulate a logged-in state.
    // This will be replaced by actual Firebase auth later.
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    renderEntries();
});
