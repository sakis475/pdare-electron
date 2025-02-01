import { ipcMain } from "electron";
import Store from "electron-store";
import { getConnectionCode } from "../../main/utils/requests";

export const STORAGE_KEYS = {
  CONNECTION_DATA: "connection_data",
  PRINTERS_DATA: "printer_data",
  LAST_UPDATED: "connection_last_updated",
} as const;

class StorageUtil {
  private store: Store;

  constructor() {
    this.store = new Store({
      // Optional: you can add schema validation here
      defaults: {}, // Default values for your store
    });
  }

  public set<T>(key: string, value: T): void {
    try {
      this.store.set(key, value);
    } catch (error) {
      console.error("Error saving to store:", error);
    }
  }

  public get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      return this.store.get(key, defaultValue) as T;
    } catch (error) {
      console.error("Error reading from store:", error);
      return defaultValue;
    }
  }

  public delete(key: string): void {
    try {
      this.store.delete(key);
    } catch (error) {
      console.error("Error deleting from store:", error);
    }
  }

  public has(key: string): boolean {
    return this.store.has(key);
  }

  public clear(): void {
    try {
      this.store.clear();
    } catch (error) {
      console.error("Error clearing store:", error);
    }
  }
}

// Create and export a single instance
export const storage = new StorageUtil();

export async function fetchAndStoreConnection(
  email: string,
  password: string
): Promise<ConnectionResponse> {
  try {
    // Get connection data from API
    const connectionData = await getConnectionCode(email, password);
    // Prepare data for storage with timestamp
    const storedData: StoredConnectionData = {
      data: connectionData,
      timestamp: Date.now(),
    };
    // Store in localStorage
    storage.set(STORAGE_KEYS.CONNECTION_DATA, storedData);
    return connectionData;
  } catch (error: any) {
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    if (error?.data?.message) {
      return error.data.message;
    }
    throw error;
  }
}

export async function getStoredConnection(): Promise<
  StoredConnectionData | undefined
> {
  return storage.get<StoredConnectionData>(STORAGE_KEYS.CONNECTION_DATA);
}

export async function clearConnection(): Promise<void> {
  storage.delete(STORAGE_KEYS.CONNECTION_DATA);
}

export async function fetchAndStoreConnectionBridge(): Promise<void> {
  ipcMain.handle("fetch-and-store-connection", async (event, credentials) => {
    return await fetchAndStoreConnection(
      credentials.email,
      credentials.password
    );
  });
}

export async function getStoredConnectionBridge(): Promise<void> {
  ipcMain.handle("get-stored-connection", async (event) => {
    return storage.get<StoredConnectionData>(STORAGE_KEYS.CONNECTION_DATA);
  });
}

export async function clearConnectionBridge(): Promise<void> {
  ipcMain.handle("clear-stored-connection", async (event) => {
    storage.delete(STORAGE_KEYS.CONNECTION_DATA);
  });
}

export default StorageUtil;
