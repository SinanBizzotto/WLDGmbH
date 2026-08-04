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
  const s = String(u).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function byTitle(a, b) {
  return String(a.title || "").localeCompare(String(b.title || ""), "de");
}

function getYear(p) {
  const y = Number(p.year);
  return Number.isFinite(y) ? y : 0;
}

const els = {
  grid: document.querySelector("#projectGrid"),
  q: document.querySelector("#q"),
  sort: document.querySelector("#sort"),
  count: document.querySelector("#projectCount"),
  chips: document.querySelector("#tagChips"),

  modal: document.querySelector("#projectModal"),
  mTitle: document.querySelector("#mTitle"),
  mMeta: document.querySelector("#mMeta"),
  mImg: document.querySelector("#mImg"),
  mDesc: document.querySelector("#mDesc"),
  mStack: document.querySelector("#mStack"),
  mTags: document.querySelector("#mTags"),
  mActions: document.querySelector("#mActions"),
  modalClose: document.querySelector("#modalClose"),
};

let activeTag = "Alle";
let state = Array.isArray(projects) ? [...projects] : [];

function buildTags(items) {
  const tags = uniq(items.flatMap(p => Array.isArray(p.tags) ? p.tags : []))
    .sort((a, b) => String(a).localeCompare(String(b), "de"));

  return ["Alle", ...tags];
}

function renderChips(tags) {
  if (!els.chips) return;

  els.chips.innerHTML = tags.map(t => `
    <button class="chip ${t === activeTag ? "is-active" : ""}" type="button" data-tag="${escapeHtml(t)}">
      ${escapeHtml(t)}
    </button>
  `).join("");

  els.chips.querySelectorAll("[data-tag]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeTag = btn.getAttribute("data-tag") || "Alle";
      render();
    });
  });
}

function matchesQuery(p, q) {
  if (!q) return true;
  const hay = [
    p.title,
    p.description,
    p.type,
    p.client,
    ...(Array.isArray(p.stack) ? p.stack : []),
    ...(Array.isArray(p.tags) ? p.tags : []),
  ].filter(Boolean).join(" ").toLowerCase();

  return hay.includes(q.toLowerCase());
}

function filterItems(items) {
  const q = (els.q?.value || "").trim();
  return items.filter(p => {
    const tagOk = activeTag === "Alle" || (Array.isArray(p.tags) && p.tags.includes(activeTag));
    const qOk = matchesQuery(p, q);
    return tagOk && qOk;
  });
}

function sortItems(items) {
  const mode = els.sort?.value || "newest";
  const copy = [...items];

  if (mode === "title") copy.sort(byTitle);
  else if (mode === "oldest") copy.sort((a, b) => getYear(a) - getYear(b));
  else copy.sort((a, b) => getYear(b) - getYear(a)); // newest default

  return copy;
}

function openModal(p) {
  if (!els.modal) return;

  const live = normalizeUrl(p.links?.live);
  const repo = normalizeUrl(p.links?.repo);

  els.mTitle.textContent = p.title || "—";
  els.mMeta.textContent = [p.type, p.year, p.status].filter(Boolean).join(" · ") || "—";

  if (p.image) {
    els.mImg.src = p.image;
    els.mImg.alt = p.title || "";
    els.mImg.style.display = "block";
  } else {
    els.mImg.removeAttribute("src");
    els.mImg.alt = "";
    els.mImg.style.display = "none";
  }

  els.mDesc.textContent = p.description || "";
  els.mStack.textContent = Array.isArray(p.stack) ? p.stack.join(", ") : "—";

  els.mTags.innerHTML = Array.isArray(p.tags) && p.tags.length
    ? p.tags.map(t => `<span class="pill">${escapeHtml(t)}</span>`).join("")
    : `<span class="muted">—</span>`;

  els.mActions.innerHTML = `
    ${live ? `<a class="btn btn--ghost" href="${escapeHtml(live)}" target="_blank" rel="noopener">Live</a>` : ""}
    ${repo ? `<a class="btn btn--ghost" href="${escapeHtml(repo)}" target="_blank" rel="noopener">Repo</a>` : ""}
  `;

  els.modal.showModal();
}

function renderProjects(items) {
  if (!els.grid) return;

  if (!Array.isArray(items) || items.length === 0) {
    els.grid.innerHTML = `<p class="muted">Keine Treffer. Stand jetzt: Suchbegriff/Tag zu restriktiv.</p>`;
    return;
  }

  els.grid.innerHTML = "";

  items.forEach((p) => {
    const live = normalizeUrl(p.links?.live);
    const repo = normalizeUrl(p.links?.repo);

    const el = document.createElement("article");
    el.className = "card";

    el.innerHTML = `
      <div class="card__media">
        ${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title || "")}" loading="lazy" />` : ""}
      </div>

      <div class="card__body">
        <div class="card__top">
          <div style="min-width:0">
            <h3 style="margin:0 0 6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${escapeHtml(p.title || "")}
            </h3>
            <p class="tiny muted">${escapeHtml([p.type, p.year].filter(Boolean).join(" · "))}</p>
          </div>
          ${p.status ? `<span class="badge">${escapeHtml(p.status)}</span>` : ""}
        </div>

        ${p.description ? `<p class="muted" style="margin:0;">${escapeHtml(p.description)}</p>` : ""}

        ${Array.isArray(p.tags) && p.tags.length
        ? `<div>${p.tags.slice(0, 6).map(t => `<span class="pill">${escapeHtml(t)}</span>`).join("")}</div>`
        : ""
      }

        <div class="card__actions">
          ${live ? `<a class="btn btn--ghost" href="${escapeHtml(live)}" target="_blank" rel="noopener">Live</a>` : ""}
          ${repo ? `<a class="btn btn--ghost" href="${escapeHtml(repo)}" target="_blank" rel="noopener">Repo</a>` : ""}
          <button class="btn btn--ghost" type="button" data-details>Details</button>
        </div>
      </div>
    `;

    el.querySelector("[data-details]")?.addEventListener("click", () => openModal(p));
    els.grid.appendChild(el);
  });
}

function render() {
  const filtered = filterItems(state);
  const sorted = sortItems(filtered);

  if (els.count) els.count.textContent = String(sorted.length);
  renderProjects(sorted);
}

function init() {
  // Footer year
  const y = document.querySelector("#year");
  if (y) y.textContent = String(new Date().getFullYear());

  // Chips
  renderChips(buildTags(state));

  // Events
  els.q?.addEventListener("input", render);
  els.sort?.addEventListener("change", render);

  // Modal close
  els.modalClose?.addEventListener("click", () => els.modal?.close());
  els.modal?.addEventListener("click", (e) => {
    // klick auf backdrop schliesst
    const rect = els.modal.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (!inside) els.modal.close();
  });

  render();
}

init();
