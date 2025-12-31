// assets/portfolio/js/app.js
import { fetchProjects } from "./projects.js";

function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

function renderProjects(projects) {
  const grid = document.querySelector("#projects-grid");
  if (!grid) return;

  grid.innerHTML = "";

  projects.forEach((p) => {
    const el = document.createElement("article");
    el.className = "project-card";

    el.innerHTML = `
      <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}" />
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.description || "")}</p>
      <div class="links">
        ${p.links?.live ? `<a href="${p.links.live}" target="_blank">Live</a>` : ""}
        ${p.links?.repo ? `<a href="${p.links.repo}" target="_blank">Repo</a>` : ""}
      </div>
    `;

    grid.appendChild(el);
  });
}

async function init() {
  try {
    const projects = await fetchProjects();
    renderProjects(projects);
  } catch (err) {
    console.error(err);
    const grid = document.querySelector("#projects-grid");
    if (grid) {
      grid.innerHTML = `<p class="error">Projekte konnten nicht geladen werden.</p>`;
    }
  }
}

init();
