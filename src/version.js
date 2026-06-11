// Comparaison de numéros de version "x.y.z" (utilisé pour détecter les mises à jour).

export function normalizeVersion(v) {
  return String(v || "").trim().replace(/^v/i, "");
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
