
let store;

// Electron environment detect कर
if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
  const Store = require('electron-store');
  store = new Store();
} else {
  // Browser fallback (localStorage) - dev mode के लिए
  store = {
    get: (key, defaultValue = []) => {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    },
    set: (key, value) => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    delete: (key) => {
      localStorage.removeItem(key);
    },
  };
}

export const dataStore = {
  getGems: () => store.get('gems', []),
  saveGems: (gems) => store.set('gems', gems),

  getTransactions: () => store.get('transactions', []),
  saveTransactions: (transactions) => store.set('transactions', transactions),

  getCustomers: () => store.get('customers', []),
  saveCustomers: (customers) => store.set('customers', customers),

  getSuppliers: () => store.get('suppliers', []),
  saveSuppliers: (suppliers) => store.set('suppliers', suppliers),

  // अगर और keys हैं तो यहीं add कर
};
