import { ipcMain } from "electron";
import Store from "electron-store";
import { StorageTypes, StorageKey } from "../types/storage";

const store = new Store<StorageTypes>({
  defaults: {
    currentUser: null,
    connectionCode: "",
    version: "1.0.0",
  },
});

export function setupStorageHandlers() {
  ipcMain.handle("storage:get", async (_, key: StorageKey) => {
    try {
      return store.get(key);
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      throw error;
    }
  });

  ipcMain.handle(
    "storage:set",
    async (_, { key, value }: { key: StorageKey; value: any }) => {
      try {
        store.set(key, value);
      } catch (error) {
        console.error(`Error setting ${key} in storage:`, error);
        throw error;
      }
    }
  );

  ipcMain.handle("storage:delete", async (_, key: StorageKey) => {
    try {
      store.delete(key);
    } catch (error) {
      console.error(`Error deleting ${key} from storage:`, error);
      throw error;
    }
  });

  ipcMain.handle("storage:clear", async () => {
    try {
      store.clear();
    } catch (error) {
      console.error("Error clearing storage:", error);
      throw error;
    }
  });
}
