# Conversation Claude Code — mise en place du pack XYVEL Medical & du hub `xyvel-medical`

> Transcription de la session de travail avec Claude Code (Opus 4.8).
> Aucune valeur de secret n'apparaît ici : mots de passe et base64 de signature
> restent uniquement dans `SIGNING-SECRETS.txt` (local, non commité).

---

## 1. Organisation des dossiers du pack

**Utilisateur :** Si je veux faire une application XYVEL Medical, un pack qui contient
plusieurs sous-applications comme MigraineLog, comment organiser mes dossiers en local
pour faciliter le travail avec Claude Code ?

**Claude :** Première proposition d'un monorepo avec workspaces npm (`apps/`, `packages/`
partagés). Le principe clé : chaque app avec un `CLAUDE.md` propre, contexte délimité.

**Utilisateur :** Je préfère séparer les apps. XYVEL Medical serait une app qui installe
en package celles qu'il contient. Quelle est la structure la plus simple ?

**Claude :** Recommandation finale — **structure simple, apps indépendantes** :

```
XyvelMedical/                 ← dossier parent (rangement, pas un dépôt git)
├── xyvel-medical/            ← l'app "hub" (lanceur)
├── migraine-log/             ← app indépendante
└── _template-app/            ← gabarit pour nouvelles apps
```

Règle d'or : **ouvrir Claude Code dans le dossier de l'app concernée**, pas dans le parent.
Un dépôt git par app. Un `appId` unique par app (`com.xyvel.*`).

---

## 2. Création de la structure

**Utilisateur :** Organise tout ça toi-même : crée les fichiers, dossiers et repos.

**Claude :** Création de :
- `XyvelMedical/` (parent) avec `README.md` + `CLAUDE.md` (conventions, règle d'or)
- `xyvel-medical/` : hub Vite + React (lanceur affichant une grille de sous-apps via
  `src/apps.js`), dépôt git initialisé et commité
- `_template-app/` : squelette Vite + React réutilisable
- `MigraineLog/` : ajout de son `CLAUDE.md`, commité

Déplacement de `MigraineLog` dans le pack : bloqué d'abord par des verrous Windows
(démon Gradle, adb, puis VS Code lui-même hébergeant la session). Finalement déplacé
par l'utilisateur (dossier renommé `MigraineLog`, doc alignée sur ce nom).

---

## 3. Étoffer le hub

**Utilisateur :** Étoffe le hub.

**Claude :** Transformation du lanceur minimal en vraie app :
- recherche en direct (filtre nom/description)
- sections « Disponibles » / « Bientôt disponibles » (badges)
- design de marque (logo, cartes, footer avec version + compteur)
- `src/apps.js` enrichi (champ `status`, entrées de démo TensionLog/SleepLog)

Build vérifié, commité.

---

## 4. Dépôt GitHub du hub

**Utilisateur :** As-tu créé les repos nécessaires ?

**Claude :** État : dépôts locaux OK (hub + MigraineLog), parent et template
volontairement non-repos. Le hub n'avait pas de remote GitHub.

**Utilisateur :** Crée le dépôt GitHub (public).

**Claude :** `gh` non installé, pas de token, le credential manager Windows ne restitue
pas le jeton sans GUI. Solution : l'utilisateur crée le dépôt vide sur GitHub, puis
Claude câble le remote et pousse. → **https://github.com/Gladia92/xyvel-medical** (public).

---

## 5. Pipeline release complet (EXE + APK + AAB)

**Utilisateur :** Est-ce que tout est configuré dans le repo `xyvel-medical` pour avoir
l'APK, l'EXE et l'AAB en release comme pour MigraineLog ?

**Claude :** Non au départ (hub = web seulement). Réplication complète du pipeline de
MigraineLog :
- **EXE** : `electron.js` + `preload.js` + config `electron-builder` (NSIS, `installer.nsh`)
- **APK + AAB** : déps `@capacitor/*` + `capacitor.config.json` + projet `android/`
  généré (`npx cap add android`) + perso `build.gradle` (signature + injection de version)
- **CI** : `.github/workflows/build.yml` (Release avec EXE/APK/AAB signés) + `pages.yml`
- **Clés générées** : keystore Android (alias `xyvel`) + certificat Windows auto-signé
  (`xyvel-medical.cer` public suivi ; clés privées gitignorées)
- Secrets GitHub requis (valeurs dans `SIGNING-SECRETS.txt`) :
  `ANDROID_KEYSTORE_BASE64/PASSWORD`, `CSC_LINK`, `CSC_KEY_PASSWORD`

Actions manuelles restantes côté utilisateur : ajouter les 4 secrets, activer les droits
d'écriture Actions, activer GitHub Pages.

---

## 6. Icônes de l'application

**Utilisateur :** L'icône a été modifiée → mets à jour.

**Claude :** À chaque modification de `icon.png`, propagation :
- mise au carré + transparence si besoin
- `assets/logo.png` (source Capacitor), `public/logo.png` (256, UI/favicon)
- régénération des icônes Android via `@capacitor/assets generate --android`

Étapes successives :
1. Logo caducée (1048×1024) → carré 1024, icônes Electron + Android générées.
2. **Fond transparent** demandé → détourage du fond crème via `sharp`.
3. Affichage dans l'interface : ajout du favicon (`index.html`) + logo dans l'en-tête
   du lanceur (remplace la pastille « + »).
4. Nouvel emblème (globe barré) fourni transparent, mise au carré, propagation.
5. Version finale fournie en 1024×1024 transparente → propagée partout.

---

## 7. Attribution des commits

**Utilisateur :** Pourquoi GitHub affiche « XYVEL Academy » et « claude » ?

**Claude :** « XYVEL Academy » = identité git (auteur). « claude » = ligne
`Co-Authored-By: Claude` en fin de message (co-auteur).

**Décision utilisateur :** Changer l'identité git (globalement) et ne plus ajouter le
co-auteur. Appliqué :
- `git config --global user.name "XYVEL"`
- `git config --global user.email "gladia92soussa@gmail.com"`
- Plus de trailer `Co-Authored-By` sur les commits suivants.

---

## 8. Test en local

**Utilisateur :** Lance en local pour tester.

**Claude :** `npm run dev` → **http://localhost:5174/** (HTTP 200, favicon + logo servis).

---

## Récapitulatif technique du hub `xyvel-medical`

- **Stack** : Vite + React 18 ; Capacitor 7 (Android) ; Electron 28 (desktop)
- **Entrée** : `index.html` → `src/main.jsx` → `src/App.jsx` ; registre `src/apps.js`
- **appId** : `com.xyvel.medical`
- **Dépôt** : https://github.com/Gladia92/xyvel-medical (public)
- **CI** : `build.yml` (Release EXE + APK + AAB signés) + `pages.yml` (déploiement Pages)
- **Signature** : keystore Android `xyvel-medical-release.keystore` (alias `xyvel`),
  certificat `cert.pfx` / `xyvel-medical.cer`. Secrets récapitulés dans
  `SIGNING-SECRETS.txt` (local, non commité).
- **Icône** : `icon.png` (transparente) → EXE ; `assets/logo.png` source Capacitor ;
  `public/logo.png` favicon + en-tête ; icônes Android via `@capacitor/assets`.
