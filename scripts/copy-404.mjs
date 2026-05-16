import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const index = path.join(dist, "index.html");
const notFound = path.join(dist, "404.html");

if (!fs.existsSync(index)) {
  console.error("copy-404: dist/index.html not found — run vite build first");
  process.exit(1);
}
fs.copyFileSync(index, notFound);
console.log("copy-404: dist/404.html (SPA fallback for GitHub Pages)");
