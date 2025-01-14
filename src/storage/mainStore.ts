import Store from "electron-store";

interface StorageTypes {
  currentUser: User | null;
  connectionCode: string;
  version?: string;
}

type StorageKey = keyof StorageTypes;

const store = new Store<StorageTypes>({
  defaults: {
    currentUser: null,
    connectionCode: "",
    version: "1.0.0",
  },
});

export function mainGetStorage<K extends StorageKey>(
  key: K
): StorageTypes[K] | null {
  try {
    const value = store.get(key);
    return value ?? null;
  } catch (error) {
    console.error(`Error getting ${key} from storage:`, error);
    throw error;
  }
}

export function mainSetStorage<K extends StorageKey>(
  key: K,
  value: StorageTypes[K] | null
): void {
  try {
    store.set(key, value);
  } catch (error) {
    console.error(`Error setting ${key} in storage:`, error);
    throw error;
  }
}

export function mainRemoveItemStorage(key: StorageKey): void {
  try {
    store.delete(key);
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
    throw error;
  }
}

export function mainRemoveAllStorage(): void {
  try {
    store.clear();
  } catch (error) {
    console.error("Error clearing storage:", error);
    throw error;
  }
}

// Export store instance for IPC handlers
export { store };
