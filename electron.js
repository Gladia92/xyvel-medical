const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const https = require("https");
const { spawn, execFile } = require("child_process");

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 700,
    minHeight: 560,
    useContentSize: true,
    title: "XYVEL Medical",
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.center();

  // Les liens externes (repli web) s'ouvrent dans le navigateur.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    win.loadURL("http://localhost:5174");
  } else {
    win.loadFile(path.join(__dirname, "dist", "index.html"));
  }
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ───────────────────────────────────────────────────────────────────
// Installation / lancement des sous-apps (Windows)
// ───────────────────────────────────────────────────────────────────

// Cherche le chemin de l'exécutable d'une app installée en lisant les clés
// de désinstallation du registre (HKCU + HKLM) via PowerShell.
function findInstalledExe(launch) {
  return new Promise((resolve) => {
    if (process.platform !== "win32" || !launch || !launch.winDisplayName) {
      return resolve(null);
    }
    const name = String(launch.winDisplayName).replace(/'/g, "''");
    const ps = `
$ErrorActionPreference='SilentlyContinue'
$roots = @(
  'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall'
)
foreach ($r in $roots) {
  Get-ChildItem $r | ForEach-Object {
    $p = Get-ItemProperty $_.PSPath
    if ($p.DisplayName -eq '${name}') { $p.InstallLocation }
  }
}`;
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", ps],
      { windowsHide: true, timeout: 15000 },
      (err, stdout) => {
        const loc = String(stdout || "")
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean)[0];
        if (!loc) return resolve(null);
        const exe = path.join(loc, launch.winExe || "");
        resolve(fs.existsSync(exe) ? exe : null);
      }
    );
  });
}

function launchExe(exe) {
  const child = spawn(exe, [], { detached: true, stdio: "ignore" });
  child.unref();
}

// GET JSON (API GitHub) — User-Agent obligatoire.
function getJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "xyvel-medical", Accept: "application/vnd.github+json" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(getJSON(res.headers.location));
        }
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
        });
      })
      .on("error", reject);
  });
}

// Téléchargement avec suivi de progression (suit les redirections).
function download(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const go = (u) => {
      https
        .get(u, { headers: { "User-Agent": "xyvel-medical" } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            return go(res.headers.location);
          }
          if (res.statusCode !== 200) {
            return reject(new Error("HTTP " + res.statusCode));
          }
          const total = parseInt(res.headers["content-length"] || "0", 10);
          let received = 0;
          const file = fs.createWriteStream(dest);
          res.on("data", (chunk) => {
            received += chunk.length;
            if (total && onProgress) onProgress(Math.round((received / total) * 100));
          });
          res.pipe(file);
          file.on("finish", () => file.close(() => resolve()));
          file.on("error", reject);
        })
        .on("error", reject);
    };
    go(url);
  });
}

// État : l'app est-elle installée ?
ipcMain.handle("app-status", async (_e, launch) => {
  if (process.platform !== "win32") return { supported: false, installed: false };
  const exe = await findInstalledExe(launch);
  return { supported: true, installed: !!exe };
});

// Lancer l'app installée.
ipcMain.handle("app-launch", async (_e, launch) => {
  const exe = await findInstalledExe(launch);
  if (!exe) return { ok: false, reason: "not-installed" };
  launchExe(exe);
  return { ok: true };
});

// Installer (télécharge l'installeur de la dernière release, le lance, puis ouvre l'app).
ipcMain.handle("app-install", async (e, launch) => {
  const send = (phase, extra) => e.sender.send("install-progress", { id: launch.id, phase, ...extra });
  try {
    if (process.platform !== "win32") return { ok: false, error: "Installation desktop = Windows uniquement" };
    if (!launch.releasesRepo) return { ok: false, error: "Aucun dépôt de releases configuré" };

    send("lookup");
    const rel = await getJSON(`https://api.github.com/repos/${launch.releasesRepo}/releases/latest`);
    const asset = (rel.assets || []).find((a) => a.name.toLowerCase().endsWith(".exe"));
    if (!asset) return { ok: false, error: "Aucun installeur .exe dans la dernière release" };

    const dest = path.join(os.tmpdir(), asset.name);
    send("download", { pct: 0 });
    await download(asset.browser_download_url, dest, (pct) => send("download", { pct }));

    // Lance l'installeur (UI NSIS) et attend sa fermeture.
    send("install");
    await new Promise((resolve, reject) => {
      const p = spawn(dest, [], { detached: false });
      p.on("error", reject);
      p.on("close", () => resolve());
    });

    // Détecte et lance.
    const exe = await findInstalledExe(launch);
    if (exe) {
      launchExe(exe);
      send("done", { installed: true });
      return { ok: true, installed: true };
    }
    send("done", { installed: false });
    return { ok: false, error: "Installation non détectée (annulée ?)" };
  } catch (err) {
    send("error", { message: err.message });
    return { ok: false, error: err.message };
  }
});