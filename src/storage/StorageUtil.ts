class StorageUtil {
  public set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }

  public get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return defaultValue;
    }
  }

  public delete(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Error deleting from localStorage:", error);
    }
  }

  public has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  public clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  }
}

// Create and export a single instance
export const storage = new StorageUtil();

// Export the class if needed
export default StorageUtil;
