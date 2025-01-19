import { ipcRenderer } from "electron";

export const bridge = {
  reconnectSocket: async (): Promise<number> => {
    return await ipcRenderer.invoke("reconnect-socket");
  },
  disconnectSocket: async (): Promise<number> => {
    return await ipcRenderer.invoke("disconnect-socket");
  },
  fetchAndStoreConnection: async (
    email: string,
    password: string
  ): Promise<number> => {
    return await ipcRenderer.invoke("fetch-and-store-connection", {
      email,
      password,
    });
  },
  getStoredConnection: async (): Promise<StoredConnectionData | undefined> => {
    return await ipcRenderer.invoke("get-stored-connection");
  },
  clearStoredConnection: async (): Promise<void> => {
    return await ipcRenderer.invoke("clear-stored-connection");
  },
};
