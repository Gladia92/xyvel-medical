# XYVEL Medical (hub)

App « lanceur » du pack XYVEL Medical : présente et donne accès aux
sous-applications médicales (MigraineLog, etc.). Chaque sous-app reste un
**projet indépendant** ; le hub ne fait que les référencer — il ne contient
PAS leur logique métier.

## Stack
- Vite + React 18 (entrée : `index.html` → `src/main.jsx` → `src/App.jsx`)
- Capacitor 7 pour Android (`android/`)
- Electron 28 pour desktop (`electron.js`, `preload.js`)
- Le registre des sous-apps est dans `src/apps.js`

## Lancer
```bash
npm install
npm run dev            # web → http://localhost:5174
npm run electron:dev   # desktop
npm run electron:build # build desktop → out/
```
Android : `npm run cap:sync` puis build via `android/`.

## Ajouter une sous-app
Ajoute une entrée dans `src/apps.js` (id, name, description, icon, color, appId, url, status).

## Identité
- appId : `com.xyvel.medical`
- Dépôt : https://github.com/Gladia92/xyvel-medical
- CI : GitHub Actions — `build.yml` publie une Release (EXE + APK + AAB),
  `pages.yml` déploie le hub sur GitHub Pages.

## Signature / secrets
- Keystore Android : `xyvel-medical-release.keystore` (alias `xyvel`) — **non commité**.
- Certificat Windows : `cert.pfx` (privé, non commité) / `xyvel-medical.cer` (public, suivi).
- Secrets GitHub requis : `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
  `CSC_LINK`, `CSC_KEY_PASSWORD`. Valeurs récapitulées dans `SIGNING-SECRETS.txt` (local, non commité).

## Notes pour Claude Code
- Garde le hub simple. Toute la logique santé vit dans les sous-apps.
- Icônes des cartes : classes Tabler Icons (CDN dans `index.html`).
- Icône de l'app : `icon.png` (croix médicale violette).
