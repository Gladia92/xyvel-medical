const { contextBridge, ipcRenderer } = require("electron");

// API exposée au lanceur : statut / installation / lancement des sous-apps.
// Présent uniquement dans le hub desktop (Electron) — absent dans le navigateur.
contextBridge.exposeInMainWorld("xyvel", {
  isDesktop: true,
  platform: process.platform,
  appStatus: (launch) => ipcRenderer.invoke("app-status", launch),
  appLaunch: (launch) => ipcRenderer.invoke("app-launch", launch),
  appInstall: (launch) => ipcRenderer.invoke("app-install", launch),
  onInstallProgress: (cb) => {
    const handler = (_e, data) => cb(data);
    ipcRenderer.on("install-progress", handler);
    return () => ipcRenderer.removeListener("install-progress", handler);
  },
});