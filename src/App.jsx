import React from "react";
import { apps } from "./apps.js";

export default function App() {
  return (
    <div>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
          XYVEL <span style={{ color: "#7c3aed" }}>Medical</span>
        </h1>
        <p style={{ color: "#666", marginTop: 6 }}>
          Vos applications de suivi santé, regroupées en un seul endroit.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {apps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}

function AppCard({ app }) {
  const launch = (e) => {
    if (!app.url) {
      e.preventDefault();
      alert(`"${app.name}" n'a pas encore d'URL de lancement.`);
    }
  };

  return (
    <a
      href={app.url || "#"}
      target="_blank"
      rel="noreferrer"
      onClick={launch}
      style={{
        display: "block",
        padding: 20,
        background: "#fff",
        border: "0.5px solid #e2e2e2",
        borderRadius: 14,
        transition: "box-shadow 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: (app.color || "#7c3aed") + "1a",
          color: app.color || "#7c3aed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          marginBottom: 14,
        }}
      >
        <i className={`ti ${app.icon || "ti-app-window"}`} />
      </div>
      <div style={{ fontWeight: 600, fontSize: 16 }}>{app.name}</div>
      <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
        {app.description}
      </div>
    </a>
  );
}
