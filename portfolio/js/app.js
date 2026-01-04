// portfolio/js/app.js
import { projects } from "./projects.js";

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

function normalizeUrl(u) {
  if (!u) return null;
  return u;
}

function renderProjects(items) {
  const grid = document.querySelector("#projectGrid");
  if (!grid) return;

  if (!Array.isArray(items) || items.length === 0) {
    grid.innerHTML = `<p class="muted">Noch keine Projekte hinterlegt. Fülle <code>projects/*/project.json</code> und führe den Generator aus.</p>`;
    return;
  }

  grid.innerHTML = "";

  items.forEach((p) => {
    const el = document.createElement("article");
    el.className = "project";

    const live = normalizeUrl(p.links?.live);
    const repo = normalizeUrl(p.links?.repo);

    el.innerHTML = `
      <a class="project__media" href="${escapeHtml(live || '#')}" ${live ? 'target="_blank" rel="noopener"' : ''}>
        ${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}" loading="lazy" />` : ''}
      </a>
      <div class="project__body">
        <h3 class="project__title">${escapeHtml(p.title || '')}</h3>
        <p class="project__meta muted">${escapeHtml([p.type, p.year].filter(Boolean).join(' · '))}</p>
        <p class="project__desc">${escapeHtml(p.description || '')}</p>
        <div class="project__links">
          ${live ? `<a class="btn btn--ghost" href="${escapeHtml(live)}" target="_blank" rel="noopener">Live</a>` : ''}
          ${repo ? `<a class="btn btn--ghost" href="${escapeHtml(repo)}" target="_blank" rel="noopener">Repo</a>` : ''}
        </div>
      </div>
    `;

    grid.appendChild(el);
  });
}

renderProjects(projects);
