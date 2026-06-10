import React, { useMemo, useState } from "react";
import { apps } from "./apps.js";

const VERSION = "0.1.0";

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
  const isAvailable = app.status === "available" && app.url;
  const accent = app.color || "#7c3aed";

  const card = (
    <div className={`card ${isAvailable ? "available" : "soon"}`}>
      {!isAvailable && <span className="badge soon">Bientôt</span>}
      <div
        className="card-icon"
        style={{ background: accent + "1a", color: accent }}
      >
        <i className={`ti ${app.icon || "ti-app-window"}`} />
      </div>
      <div className="card-name">{app.name}</div>
      <div className="card-desc">{app.description}</div>
      {isAvailable && (
        <span className="card-cta" style={{ color: accent }}>
          Ouvrir <i className="ti ti-arrow-right" />
        </span>
      )}
    </div>
  );

  if (!isAvailable) return card;

  return (
    <a href={app.url} target="_blank" rel="noreferrer">
      {card}
    </a>
  );
}
