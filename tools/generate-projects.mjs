#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, "..");
const projectsDir = path.join(root, "projects");
const outFile = path.join(root, "portfolio", "js", "projects.js");

function readJson(p){
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function exists(p){ try { fs.accessSync(p); return true; } catch { return false; } }

const folders = exists(projectsDir)
  ? fs.readdirSync(projectsDir, { withFileTypes: true }).filter(d=>d.isDirectory()).map(d=>d.name)
  : [];

const projects = [];
const usedSlugs = new Set();

function normalizeRelAsset(dirName, maybeRelPath) {
  if (!maybeRelPath) return null;
  const s = String(maybeRelPath).trim();
  if (!s) return null;
  // Absolute URL or absolute path: keep as-is
  if (/^(https?:)?\/\//i.test(s) || s.startsWith("/")) return s;
  // Normalize "./" and ".\\" etc.
  const cleaned = s.replace(/^\.(\/|\\)/, "");
  // Path relative to project folder
  return `../projects/${dirName}/${cleaned}`;
}

for (const dir of folders) {
  const metaPath = path.join(projectsDir, dir, "project.json");
  if (!exists(metaPath)) continue;

  const raw = readJson(metaPath);
  // Support both { ... } and [ { ... } ] formats
  const meta = Array.isArray(raw) ? (raw[0] ?? {}) : (raw ?? {});

  // Defaults + Normalisierung
  let slug = meta.slug || dir;
  // Ensure stable uniqueness across folders
  if (usedSlugs.has(slug)) slug = `${slug}-${dir}`;
  usedSlugs.add(slug);
  const image = normalizeRelAsset(dir, meta.image);
  // A project.json that explicitly sets links.live to null/"" means "no live link"
  // (e.g. a private project) — only default to the folder's own index.html when
  // the live key is omitted entirely.
  const hasLiveKey = meta.links && Object.prototype.hasOwnProperty.call(meta.links, "live");
  const live = hasLiveKey
    ? (meta.links.live || null)
    : `../projects/${dir}/index.html`;

  projects.push({
    slug,
    title: meta.title || dir,
    client: meta.client || "",
    year: meta.year || new Date().getFullYear(),
    status: meta.status || "Live",
    type: meta.type || "Website",
    description: meta.description || "",
    stack: meta.stack || [],
    tags: meta.tags || [],
    links: {
      live,
      repo: meta.links?.repo || null
    },
    image
  });
}

const content = `export const projects = ${JSON.stringify(projects, null, 2)};\n`;
fs.writeFileSync(outFile, content, "utf8");

console.log(`OK: ${projects.length} Projekte → ${path.relative(root, outFile)}`);
