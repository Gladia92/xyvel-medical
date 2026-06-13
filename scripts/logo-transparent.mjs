// Rend transparent le fond blanc de public/logo.png.
// Stratégie : flood-fill depuis les bords sur les pixels (quasi) blancs, pour
// ne PAS effacer les reflets blancs intérieurs du serpent argenté.
import sharp from "sharp";
import { fileURLToPath } from "url";
import path from "path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "public", "logo.png");
const OUT = SRC; // on remplace en place

const img = sharp(SRC).ensureAlpha();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

// Un pixel est « blanc de fond » s'il est très clair.
const isWhite = (i) => data[i] > 238 && data[i + 1] > 238 && data[i + 2] > 238;

const visited = new Uint8Array(W * H);
const stack = [];
const push = (x, y) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const p = y * W + x;
  if (visited[p]) return;
  visited[p] = 1;
  if (isWhite(p * C)) stack.push(p);
};

// Amorce depuis tout le pourtour de l'image.
for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }

while (stack.length) {
  const p = stack.pop();
  const x = p % W, y = (p / W) | 0;
  data[p * C + 3] = 0; // transparent
  push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
}

// Adoucit le liseré : pixels clairs adjacents à du transparent → alpha partiel.
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * C;
    if (data[i + 3] === 0) continue;
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (lum > 210) {
      const neigh = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => {
        const nx = x+dx, ny = y+dy;
        if (nx<0||ny<0||nx>=W||ny>=H) return false;
        return data[(ny*W+nx)*C + 3] === 0;
      });
      if (neigh) data[i + 3] = Math.round(((255 - lum) / 45) * 255);
    }
  }
}

await sharp(data, { raw: { width: W, height: H, channels: C } })
  .png()
  .toFile(OUT + ".tmp");

import { renameSync } from "fs";
renameSync(OUT + ".tmp", OUT);
console.log(`OK — fond rendu transparent (${W}x${H}).`);
