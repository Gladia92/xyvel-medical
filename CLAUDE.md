# XYVEL Medical (hub)

App « lanceur » du pack XYVEL Medical : présente et donne accès aux
sous-applications médicales (MigraineLog, etc.). Chaque sous-app reste un
**projet indépendant** ; le hub ne fait que les référencer — il ne contient
PAS leur logique métier.

## Stack
- Vite + React 18 (entrée : `index.html` → `src/main.jsx` → `src/App.jsx`)
- Le registre des sous-apps est dans `src/apps.js`

## Lancer
```bash
npm install
npm run dev        # http://localhost:5174
npm run build      # → dist/
```

## Ajouter une sous-app
Ajoute une entrée dans `src/apps.js` (id, name, description, icon, color, appId, url).

## Identité
- appId : `com.xyvel.medical`
- Dépôt git : local (indépendant)

## Notes pour Claude Code
- Garde le hub simple. Toute la logique santé vit dans les sous-apps.
- Icônes : classes Tabler Icons (chargées via CDN dans `index.html`).
