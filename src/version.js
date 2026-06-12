// Comparaison de numéros de version "x.y.z" (utilisé pour détecter les mises à jour).

export function normalizeVersion(v) {
  // Retire le préfixe "v" et les métadonnées semver (-prerelease / +build),
  // ex: "v0.1.0-build10" et "0.1.0+build.10.2026.06.12.0541" -> "0.1.0".
  return String(v || "").trim().replace(/^v/i, "").replace(/[-+].*$/, "");
}

// > 0 si a > b, < 0 si a < b, 0 si égales.
export function compareVersions(a, b) {
  const pa = normalizeVersion(a).split(".").map((n) => parseInt(n, 10) || 0);
  const pb = normalizeVersion(b).split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// Numéro de build CI, ex: "v0.1.0-build10" ou "0.1.0+build.10.2026.06.12.0541" -> 10.
// 0 si absent (versions sans numéro de build, ex: MigraineLog "v1.1.0").
export function buildNumber(v) {
  const m = String(v || "").match(/build\.?(\d+)/i);
  return m ? parseInt(m[1], 10) : 0;
}

// Une mise à jour est disponible si la version de base est plus récente, ou si
// elle est identique mais que le numéro de build CI est plus élevé.
export function isUpdateAvailable(latestVersion, latestBuild, installedVersion, installedBuild) {
  const baseDiff = compareVersions(latestVersion, installedVersion);
  if (baseDiff !== 0) return baseDiff > 0;
  return (latestBuild || 0) > (installedBuild || 0);
}
