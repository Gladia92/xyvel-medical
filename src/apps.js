// Registre des sous-applications du pack XYVEL Medical.
// Ajoute une entrée ici chaque fois que tu crées une nouvelle app.
//   icon   = classe Tabler Icons (https://tabler.io/icons)
//   status = "available" (lançable) | "soon" (à venir)
//   launch = comment installer/lancer l'app depuis le hub desktop (Electron) :
//            winDisplayName = nom affiché dans la liste des programmes (détection registre)
//            winExe         = exécutable installé
//            releasesRepo   = dépôt GitHub d'où télécharger l'installeur (.exe)
//            androidPackage = id de paquet Android (pour lancer/installer sur mobile)
//   url    = repli web (navigateur), où l'on ne peut pas installer/lancer un programme

export const apps = [
  {
    id: "migraine-log",
    name: "MigraineLog",
    description: "Journal de migraines : crises, déclencheurs et traitements.",
    icon: "ti-brain",
    color: "#7c3aed",
    appId: "com.migrainelog.app",
    status: "available",
    launch: {
      winDisplayName: "MigraineLog",
      winExe: "MigraineLog.exe",
      releasesRepo: "Gladia92/migrainelog",
      androidPackage: "com.migrainelog.app",
    },
    url: "https://gladia92.github.io/migrainelog/",
  },
  {
    id: "suivimed",
    name: "SuiviMed",
    description: "Suivi des prises de médicaments et de l'observance (matin/midi/soir).",
    icon: "ti-pill",
    color: "#0891b2",
    appId: "com.xyvel.suivimed",
    status: "available",
    launch: {
      winDisplayName: "SuiviMed",
      winExe: "SuiviMed.exe",
      androidPackage: "com.xyvel.suivimed",
    },
    url: "",
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