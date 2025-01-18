// import { contextBridge, ipcRenderer } from "electron";

// // Export the API that will be exposed to the renderer process
// contextBridge.exposeInMainWorld("api", {
//   send: (channel: string, data?: any) => {
//     const validChannels = [
//       "socket:connect",
//       "socket:disconnect",
//       "socket:event",
//     ];
//     if (validChannels.includes(channel)) {
//       ipcRenderer.send(channel, data);
//     }
//   },
//   receive: (channel: string, func: (...args: any[]) => void) => {
//     const validChannels = ["socket:event", "socket:status"];
//     if (validChannels.includes(channel)) {
//       ipcRenderer.removeAllListeners(channel);
//       ipcRenderer.on(channel, (event, ...args) => func(...args));
//     }
//   },
//   storage: {
//     get: (key: string) => ipcRenderer.invoke("storage:get", key),
//     set: (key: string, value: any) =>
//       ipcRenderer.invoke("storage:set", { key, value }),
//     delete: (key: string) => ipcRenderer.invoke("storage:delete", key),
//     clear: () => ipcRenderer.invoke("storage:clear"),
//   },
// });
