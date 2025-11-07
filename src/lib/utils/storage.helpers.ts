// Helper functions for safely interacting with localStorage/IndexedDB

export const saveToLocalStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to local storage:', error);
  }
};

export const loadFromLocalStorage = <T>(key: string): T | null => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading from local storage:', error);
    return null;
  }
};

// You might want to add IndexedDB helpers here for larger datasets.