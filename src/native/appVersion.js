import { registerPlugin } from "@capacitor/core";

// Plugin natif Android (AppVersionPlugin.java) : lit la version installée
// d'une autre app via PackageManager.getPackageInfo(). Aucune implémentation
// web/desktop — n'appeler que sur Android.
const AppVersion = registerPlugin("AppVersion");

export default AppVersion;
