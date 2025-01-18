import { ipcRenderer } from "electron";

export const bridge = {
  reconnectSocket: async (): Promise<number> => {
    return await ipcRenderer.invoke("reconnect-socket");
  },
  disconnectSocket: async (): Promise<number> => {
    return await ipcRenderer.invoke("disconnect-socket");
  },
};
