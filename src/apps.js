// Registre des sous-applications du pack XYVEL Medical.
// Ajoute une entrée ici chaque fois que tu crées une nouvelle app.
// `icon` = classe Tabler Icons (https://tabler.io/icons).

export const apps = [
  {
    id: "migraine-log",
    name: "MigraineLog",
    description: "Journal de migraines numérique",
    icon: "ti-brain",
    color: "#7c3aed",
    appId: "com.migrainelog.app",
    // Où lancer l'app (web déployé, ou à adapter selon la plateforme).
    url: "https://gladia92.github.io/migrainelog/",
  },
  // Exemple de future app (décommente et adapte) :
  // {
  //   id: "tension-log",
  //   name: "TensionLog",
  //   description: "Suivi de la tension artérielle",
  //   icon: "ti-heart-rate-monitor",
  //   color: "#dc2626",
  //   appId: "com.xyvel.tensionlog",
  //   url: "",
  // },
];
