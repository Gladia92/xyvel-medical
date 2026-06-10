const { contextBridge } = require("electron");

// Le hub est un simple lanceur : pas d'API privilégiée exposée au web.
// On expose seulement la version, utile pour un éventuel affichage.
contextBridge.exposeInMainWorld("xyvel", {
  platform: process.platform,
  versions: process.versions,
});
