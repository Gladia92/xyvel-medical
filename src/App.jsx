import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { AppLauncher } from "@capacitor/app-launcher";
import { apps } from "./apps.js";
import AppVersion from "./native/appVersion.js";
import { buildNumber, isUpdateAvailable } from "./version.js";

const VERSION = "0.1.0";

const electronDesktop =
  typeof window !== "undefined" && window.xyvel && window.xyvel.isDesktop;
let capPlatform = "web";
try { capPlatform = Capacitor.getPlatform(); } catch (e) { /* web */ }
const isAndroid = capPlatform === "android";

// Une carte peut installer/lancer nativement si on est sur desktop ou Android.
const nativeMode = (app) => !!app.launch && (electronDesktop || isAndroid);

// ── Abstraction installation/lancement multi-plateforme ──────────────
async function latestRelease(repo) {
  const r = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

async function latestAssetUrl(repo, ext) {
  const j = await latestRelease(repo);
  const a = (j.assets || []).find((x) => x.name.toLowerCase().endsWith(ext));
  return a ? a.browser_download_url : null;
}

async function checkInstalled(app) {
  if (electronDesktop) {
    const r = await window.xyvel.appStatus({ ...app.launch, id: app.id });
    return { installed: !!(r && r.installed), updateAvailable: !!(r && r.updateAvailable) };
  }
  if (isAndroid) {
    try {
      const r = await AppLauncher.canOpenUrl({ url: app.launch.androidPackage });
      if (!r.value) return { installed: false, updateAvailable: false };

      let updateAvailable = false;
      try {
        const v = await AppVersion.getInstalledVersion({ packageName: app.launch.androidPackage });
        if (v && v.installed && v.versionName && app.launch.releasesRepo) {
          const rel = await latestRelease(app.launch.releasesRepo);
          updateAvailable = isUpdateAvailable(
            rel.tag_name, buildNumber(rel.tag_name),
            v.versionName, v.versionCode
          );
        }
      } catch (e) {
        // Plugin natif indisponible (ex: build pas encore synchronisé) -> pas de détection de MAJ.
      }
      return { installed: true, updateAvailable };
    } catch (e) { return { installed: false, updateAvailable: false }; }
  }
  return { installed: false, updateAvailable: false };
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
  const [backToast, setBackToast] = useState(false);

  // ── Bouton retour Android : revient à l'accueil (efface la recherche),
  //    puis double appui pour quitter l'application (comme les apps natives).
  const backHandlerRef = useRef(() => {});
  const lastBackRef = useRef(0);
  const toastTimer = useRef(null);
  backHandlerRef.current = () => {
    if (query.trim()) { setQuery(""); return; }
    const now = Date.now();
    if (now - lastBackRef.current < 2000) {
      CapacitorApp.exitApp();
    } else {
      lastBackRef.current = now;
      setBackToast(true);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setBackToast(false), 2000);
    }
  };

  useEffect(() => {
    if (!isAndroid) return;
    let handle;
    CapacitorApp.addListener("backButton", () => backHandlerRef.current())
      .then((h) => { handle = h; })
      .catch(() => {});
    return () => { if (handle) handle.remove(); };
  }, []);

  // ── Rafraîchissement : re-vérifie l'état (installé / à jour) de chaque carte.
  //    Déclenché au retour dans le hub (resume Android / focus desktop) — par ex.
  //    après l'installation d'un APK par le système — et par le pull-to-refresh.
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [pull, setPull] = useState(0);          // distance de tirage (px)
  const [refreshing, setRefreshing] = useState(false);
  const pullStart = useRef(null);
  const refreshTimer = useRef(null);

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshNonce((n) => n + 1);
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => setRefreshing(false), 1100);
  }, []);

  useEffect(() => {
    if (isAndroid) {
      let h;
      CapacitorApp.addListener("appStateChange", ({ isActive }) => { if (isActive) doRefresh(); })
        .then((x) => { h = x; })
        .catch(() => {});
      return () => { if (h) h.remove(); };
    }
    if (electronDesktop) {
      const onFocus = () => doRefresh();
      window.addEventListener("focus", onFocus);
      return () => window.removeEventListener("focus", onFocus);
    }
  }, [doRefresh]);

  // Pull-to-refresh : glisser vers le bas quand on est tout en haut de la page.
  const onTouchStart = (e) => {
    pullStart.current = window.scrollY <= 0 && !refreshing ? e.touches[0].clientY : null;
  };
  const onTouchMove = (e) => {
    if (pullStart.current == null) return;
    const dy = e.touches[0].clientY - pullStart.current;
    if (dy > 0 && window.scrollY <= 0) setPull(Math.min(dy * 0.45, 90));
    else setPull(0);
  };
  const onTouchEnd = () => {
    if (pull > 60) doRefresh();
    setPull(0);
    pullStart.current = null;
  };

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
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        className="ptr"
        style={{
          height: refreshing ? 46 : pull,
          opacity: refreshing || pull > 4 ? 1 : 0,
        }}
      >
        <i className={`ti ti-refresh ${refreshing ? "spin" : ""}`}
           style={refreshing ? undefined : { transform: `rotate(${pull * 3}deg)` }} />
      </div>

      <div className="hero">
        <div className="logo-wrap">
          <img className="brand-logo" src="./logo.png" alt="XYVEL Medical" />
        </div>
        <div className="brand-name">XYVEL Medical</div>

        <h1>Vos applications santé</h1>
        <p className="tagline">
          Suivez vos symptômes au quotidien. Choisissez une application pour
          commencer.
        </p>
      </div>

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
              <AppCard key={app.id} app={app} refreshNonce={refreshNonce} />
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

      {backToast && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 24,
            transform: "translateX(-50%)",
            background: "rgba(20,20,30,0.92)",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 999,
            fontSize: 14,
            zIndex: 1000,
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          }}
        >
          Appuyez de nouveau sur Retour pour quitter
        </div>
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

// Convertit un hex (#rrggbb) en rgba() avec l'alpha donné.
function hexA(hex, a) {
  const h = (hex || "#7c3aed").replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function AppCard({ app, refreshNonce }) {
  const accent = app.color || "#7c3aed";
  const accentVars = { "--accent": accent, "--glow": hexA(accent, 0.28) };
  const canLaunch = nativeMode(app);
  const [status, setStatus] = useState(canLaunch ? "checking" : "web");
  const [progress, setProgress] = useState(null); // { phase, pct, message }
  const installingRef = useRef(false);

  // Vérifie l'installation au montage ET à chaque rafraîchissement (resume /
  // focus / pull-to-refresh) -> remet la carte dans le bon état après une
  // installation ou mise à jour faite hors de l'app (système Android).
  useEffect(() => {
    if (!canLaunch || installingRef.current) return;
    let alive = true;
    checkInstalled(app)
      .then((r) => {
        if (!alive) return;
        setProgress(null);
        if (!r.installed) setStatus("not-installed");
        else setStatus(r.updateAvailable ? "update-available" : "installed");
      })
      .catch(() => alive && setStatus("not-installed"));
    return () => { alive = false; };
  }, [refreshNonce]);

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
    const wasInstalled = status === "installed" || status === "update-available";
    installingRef.current = true;
    setStatus("installing");
    setProgress({ phase: "lookup" });
    const r = await installApp(app);
    installingRef.current = false;
    if (r && r.androidDownload) {
      // Android : le système télécharge puis installe l'APK hors de l'app. On
      // garde l'état connu et on informe ; au retour dans le hub, le re-check
      // (resume) ajustera automatiquement « Ouvrir » / « Mettre à jour ».
      setStatus(wasInstalled ? "installed" : "not-installed");
      setProgress({ phase: "android-hint", update: wasInstalled });
    } else if (r && r.ok === false) {
      setProgress({ phase: "error", message: r.error });
      setStatus(wasInstalled ? "update-available" : "not-installed");
    }
  };

  // ─ Carte « à venir »
  if (app.status !== "available") {
    return (
      <div className="card soon" style={accentVars}>
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
        style={status === "installing" ? { ...accentVars, cursor: "default" } : accentVars}
      >
        {status === "update-available" && <span className="badge update">Mise à jour</span>}
        <CardHead app={app} accent={accent} />
        <span className="card-cta" style={{ color: accent }}>
          {status === "checking" && <>Vérification…</>}
          {status === "installed" && <>Ouvrir <i className="ti ti-arrow-right" /></>}
          {status === "update-available" && <><i className="ti ti-download" /> Mettre à jour</>}
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
          <span className="hint">
            {progress.update
              ? "Téléchargement de la mise à jour… installe-la, puis reviens dans le hub (l'état se met à jour tout seul)."
              : "Téléchargement de l'APK… installe-le, puis reviens dans le hub pour lancer l'app."}
          </span>
        )}
      </div>
    );
  }

  // ─ Web (navigateur) : repli sur le lien
  return (
    <a className="card available" href={app.url || "#"} target="_blank" rel="noreferrer" style={accentVars}
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
      <div className="card-icon" style={{ background: `linear-gradient(135deg, ${hexA(accent, 0.18)}, ${hexA(accent, 0.08)})`, color: accent }}>
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