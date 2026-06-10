// Registre des sous-applications du pack XYVEL Medical.
// Ajoute une entrée ici chaque fois que tu crées une nouvelle app.
//   icon   = classe Tabler Icons (https://tabler.io/icons)
//   status = "available" (lançable) | "soon" (à venir)

export const apps = [
  {
    id: "migraine-log",
    name: "MigraineLog",
    description: "Journal de migraines : crises, déclencheurs et traitements.",
    icon: "ti-brain",
    color: "#7c3aed",
    appId: "com.migrainelog.app",
    url: "https://gladia92.github.io/migrainelog/",
    status: "available",
  },
  {
    id: "tension-log",
    name: "TensionLog",
    description: "Suivi de la tension artérielle au quotidien.",
    icon: "ti-heartbeat",
    color: "#dc2626",
    appId: "com.xyvel.tensionlog",
    url: "",
    status: "soon",
  },
  {
    id: "sleep-log",
    name: "SleepLog",
    description: "Carnet de sommeil et qualité du repos.",
    icon: "ti-moon",
    color: "#2563eb",
    appId: "com.xyvel.sleeplog",
    url: "",
    status: "soon",
  },
];
