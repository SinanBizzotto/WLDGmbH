#!/usr/bin/env node
/**
 * Generator: liest /projects/*/project.json und schreibt /portfolio/js/projects.js
 * Ziel: Projekte einmal als JSON pflegen, Portfolio rendert automatisch.
 *
 * Usage:
 *   node ./tools/generate-projects.mjs
 */
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

for (const dir of folders) {
  const metaPath = path.join(projectsDir, dir, "project.json");
  if (!exists(metaPath)) continue;

  const meta = readJson(metaPath);

  // Defaults + Normalisierung
  const slug = meta.slug || dir;
  const image = meta.image || null;

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
      live: meta.links?.live || `../projects/${dir}/index.html`,
      repo: meta.links?.repo || null
    },
    image: image ? image : null
  });
}

const content = `export const projects = ${JSON.stringify(projects, null, 2)};\n`;
fs.writeFileSync(outFile, content, "utf8");

console.log(`OK: ${projects.length} Projekte → ${path.relative(root, outFile)}`);
