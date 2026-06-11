import React, { useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { AppLauncher } from "@capacitor/app-launcher";
import { apps } from "./apps.js";

const VERSION = "0.1.0";

const electronDesktop =
  typeof window !== "undefined" && window.xyvel && window.xyvel.isDesktop;
let capPlatform = "web";
try { capPlatform = Capacitor.getPlatform(); } catch (e) { /* web */ }
const isAndroid = capPlatform === "android";

// Une carte peut installer/lancer nativement si on est sur desktop ou Android.
const nativeMode = (app) => !!app.launch && (electronDesktop || isAndroid);

// ── Abstraction installation/lancement multi-plateforme ──────────────
async function latestAssetUrl(repo, ext) {
  const r = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
  const j = await r.json();
  const a = (j.assets || []).find((x) => x.name.toLowerCase().endsWith(ext));
  return a ? a.browser_download_url : null;
}

async function checkInstalled(app) {
  if (electronDesktop) {
    const r = await window.xyvel.appStatus({ ...app.launch, id: app.id });
    return !!(r && r.installed);
  }
  if (isAndroid) {
    try {
      const r = await AppLauncher.canOpenUrl({ url: app.launch.androidPackage });
      return !!r.value;
    } catch (e) { return false; }
  }
  return false;
}

async function launchApp(app) {
  if (electronDesktop) return window.xyvel.appLaunch({ ...app.launch, id: app.id });
  if (isAndroid) return AppLauncher.openUrl({ url: app.launch.androidPackage });
}

async function installApp(app) {
  if (electronDesktop) return window.xyvel.appInstall({ ...app.launch, id: app.id });
  if (isAndroid) {
    const apk = await latestAssetUrl(app.launch.releasesRepo, ".apk");
    if (!apk) return { ok: false, error: "APK introuvable dans la dernière release" };
    await AppLauncher.openUrl({ url: apk }); // déclenche le téléchargement -> installation
    return { ok: true, androidDownload: true };
  }
}

export default function App() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );
  }, [query]);

  const available = filtered.filter((a) => a.status === "available");
  const soon = filtered.filter((a) => a.status === "soon");

  return (
    <div>
      <div className="brand">
        <img className="brand-logo" src="./logo.png" alt="XYVEL Medical" />
        <span className="brand-name">XYVEL Medical</span>
      </div>

      <h1>Vos applications santé</h1>
      <p className="tagline">
        Suivez vos symptômes au quotidien. Choisissez une application pour
        commencer.
      </p>

      <label className="search">
        <i className="ti ti-search" />
        <input
          type="text"
          placeholder="Rechercher une application…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </label>

      {filtered.length === 0 && (
        <p className="empty">Aucune application ne correspond à « {query} ».</p>
      )}

      {available.length > 0 && (
        <>
          <div className="section-label">Disponibles</div>
          <div className="grid">
            {available.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </>
      )}

      {soon.length > 0 && (
        <>
          <div className="section-label">Bientôt disponibles</div>
          <div className="grid">
            {soon.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </>
      )}

      <footer>
        <span>XYVEL Medical · v{VERSION}</span>
        <span>
          {apps.length} application{apps.length > 1 ? "s" : ""} dans le pack
        </span>
      </footer>
    </div>
  );
}

function AppCard({ app }) {
  const accent = app.color || "#7c3aed";
  const canLaunch = nativeMode(app);
  const [status, setStatus] = useState(canLaunch ? "checking" : "web");
  const [progress, setProgress] = useState(null); // { phase, pct, message }

  // Vérifie l'installation au montage (desktop / Android).
  useEffect(() => {
    if (!canLaunch) return;
    let alive = true;
    checkInstalled(app)
      .then((installed) => alive && setStatus(installed ? "installed" : "not-installed"))
      .catch(() => alive && setStatus("not-installed"));
    return () => { alive = false; };
  }, []);

  // Progression d'installation desktop (Electron).
  useEffect(() => {
    if (!electronDesktop || !window.xyvel.onInstallProgress) return;
    const off = window.xyvel.onInstallProgress((d) => {
      if (d.id !== app.id) return;
      if (d.phase === "done") {
        setProgress(null);
        setStatus(d.installed ? "installed" : "not-installed");
      } else if (d.phase === "error") {
        setProgress({ phase: "error", message: d.message });
        setStatus("not-installed");
      } else {
        setProgress({ phase: d.phase, pct: d.pct });
      }
    });
    return off;
  }, []);

  const onLaunch = async () => {
    const r = await launchApp(app);
    if (r && r.ok === false && r.reason === "not-installed") setStatus("not-installed");
  };

  const onInstall = async () => {
    setStatus("installing");
    setProgress({ phase: "lookup" });
    const r = await installApp(app);
    if (r && r.androidDownload) {
      // Android : pas de callback système -> on informe.
      setStatus("not-installed");
      setProgress({ phase: "android-hint" });
    } else if (r && r.ok === false) {
      setProgress({ phase: "error", message: r.error });
      setStatus("not-installed");
    }
  };

  // ─ Carte « à venir »
  if (app.status !== "available") {
    return (
      <div className="card soon">
        <span className="badge soon">Bientôt</span>
        <CardHead app={app} accent={accent} />
      </div>
    );
  }

  // ─ Desktop / Android : installation / lancement natif
  if (canLaunch) {
    const onClick =
      status === "installing" ? undefined : status === "installed" ? onLaunch : onInstall;
    return (
      <div
        className="card available"
        onClick={onClick}
        style={status === "installing" ? { cursor: "default" } : {}}
      >
        <CardHead app={app} accent={accent} />
        <span className="card-cta" style={{ color: accent }}>
          {status === "checking" && <>Vérification…</>}
          {status === "installed" && <>Ouvrir <i className="ti ti-arrow-right" /></>}
          {status === "not-installed" && <><i className="ti ti-download" /> Installer puis ouvrir</>}
          {status === "installing" && <ProgressLabel progress={progress} />}
        </span>
        {status === "installing" && progress && progress.phase === "download" && (
          <div className="bar"><div className="bar-fill" style={{ width: (progress.pct || 0) + "%", background: accent }} /></div>
        )}
        {progress && progress.phase === "error" && (
          <span className="err">Échec : {progress.message}</span>
        )}
        {progress && progress.phase === "android-hint" && (
          <span className="hint">Téléchargement de l'APK… installe-le, puis rouvre cette carte pour lancer l'app.</span>
        )}
      </div>
    );
  }

  // ─ Web (navigateur) : repli sur le lien
  return (
    <a className="card available" href={app.url || "#"} target="_blank" rel="noreferrer"
       onClick={(e) => { if (!app.url) { e.preventDefault(); alert(`"${app.name}" n'a pas encore de lien.`); } }}>
      <CardHead app={app} accent={accent} />
      <span className="card-cta" style={{ color: accent }}>
        Ouvrir <i className="ti ti-external-link" />
      </span>
    </a>
  );
}

function CardHead({ app, accent }) {
  return (
    <>
      <div className="card-icon" style={{ background: accent + "1a", color: accent }}>
        <i className={`ti ${app.icon || "ti-app-window"}`} />
      </div>
      <div className="card-name">{app.name}</div>
      <div className="card-desc">{app.description}</div>
    </>
  );
}

function ProgressLabel({ progress }) {
  if (!progress) return <>Installation…</>;
  switch (progress.phase) {
    case "lookup": return <>Recherche de l'installeur…</>;
    case "download": return <><i className="ti ti-download" /> Téléchargement… {progress.pct || 0}%</>;
    case "install": return <>Installation en cours…</>;
    default: return <>Installation…</>;
  }
}