// portfolio/js/app.js
// No backend. Pure static filtering/sorting/rendering.
import { projects } from "./projects.js";

const $ = (sel) => document.querySelector(sel);

function uniq(arr) {
  return Array.from(new Set(arr));
}

function norm(str = "") {
  return String(str).toLowerCase().trim();
}

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

function projectHaystack(p) {
  return norm([
    p.title,
    p.client,
    p.year,
    p.status,
    p.type,
    (p.stack || []).join(" "),
    (p.tags || []).join(" "),
    p.description
  ].join(" | "));
}

function compareBy(sortKey) {
  switch (sortKey) {
    case "oldest":
      return (a, b) => (a.year || 0) - (b.year || 0);
    case "title":
      return (a, b) => String(a.title || "").localeCompare(String(b.title || ""), "de");
    case "newest":
    default:
      return (a, b) => (b.year || 0) - (a.year || 0);
  }
}

function renderTagChips(tags, activeTag, onChange) {
  const wrap = $("#tagChips");
  if (!wrap) return;

  const all = ["Alle", ...tags];
  wrap.innerHTML = "";

  all.forEach((t) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (t === activeTag ? " is-active" : "");
    btn.textContent = t;

    btn.addEventListener("click", () => onChange(t));
    wrap.appendChild(btn);
  });
}

function renderGrid(items, onOpen) {
  const grid = $("#projectGrid");
  const count = $("#projectCount");

  if (count) count.textContent = String(items.length);
  if (!grid) return;

  grid.innerHTML = "";

  items.forEach((p, idx) => {
    const card = document.createElement("article");
    card.className = "card";
    card.setAttribute("data-idx", String(idx));

    const img = p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}" loading="lazy" />` : "";

    const tags = (p.tags || []).slice(0, 4).map(t => `<span class="pill">${escapeHtml(t)}</span>`).join("");

    card.innerHTML = `
      <div class="card__media">${img}</div>
      <div class="card__body">
        <div class="card__top">
          <div>
            <h3 style="margin:0 0 6px">${escapeHtml(p.title)}</h3>
            <div class="tiny">${escapeHtml(String(p.year || ""))} • ${escapeHtml(p.type || "")} • ${escapeHtml(p.status || "")}</div>
          </div>
          <span class="badge">${escapeHtml((p.stack || [])[0] || "Web")}</span>
        </div>
        <p class="muted" style="margin:8px 0 10px">${escapeHtml(p.description || "")}</p>
        <div>${tags}</div>
        <div class="card__actions">
          ${p.links?.live ? `<a class="btn btn--ghost" href="${escapeHtml(p.links.live)}" target="_blank" rel="noopener">Live ansehen</a>` : ""}
          <button class="btn" type="button" data-open>Details</button>
        </div>
      </div>
    `;

    card.querySelector("[data-open]")?.addEventListener("click", () => onOpen(p));
    grid.appendChild(card);
  });
}

function initModal() {
  const modal = $("#projectModal");
  const closeBtn = $("#modalClose");

  if (!modal) return { open: () => {} };

  function close() {
    modal.close();
  }

  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    // click on backdrop closes
    const rect = modal.getBoundingClientRect();
    const inDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;
    if (!inDialog) close();
  });

  function open(p) {
    $("#mTitle").textContent = p.title || "—";
    $("#mMeta").textContent = [p.client, p.year, p.type, p.status].filter(Boolean).join(" • ") || "—";
    $("#mDesc").textContent = p.description || "";
    $("#mStack").textContent = (p.stack || []).join(", ") || "—";

    const tags = (p.tags || []).map(t => `<span class="pill">${escapeHtml(t)}</span>`).join("");
    $("#mTags").innerHTML = tags || "—";

    const img = $("#mImg");
    if (img) {
      img.src = p.image || "";
      img.alt = p.title || "";
    }

    const actions = $("#mActions");
    if (actions) {
      actions.innerHTML = "";
      if (p.links?.live) {
        const a = document.createElement("a");
        a.className = "btn";
        a.href = p.links.live;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "Live öffnen";
        actions.appendChild(a);
      }
      if (p.links?.repo) {
        const a = document.createElement("a");
        a.className = "btn btn--ghost";
        a.href = p.links.repo;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "Repo";
        actions.appendChild(a);
      }
    }

    modal.showModal();
  }

  return { open, close };
}

function initNavToggle() {
  const btn = document.querySelector("[data-nav-toggle]") || document.querySelector(".navToggle");
  const nav = document.querySelector(".nav");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    nav.classList.toggle("isOpen");
    btn.setAttribute("aria-expanded", nav.classList.contains("isOpen") ? "true" : "false");
  });
}

function initYear() {
  const y = $("#year");
  if (y) y.textContent = String(new Date().getFullYear());
}

function init() {
  initNavToggle();
  initYear();

  const modal = initModal();

  const q = $("#q");
  const sort = $("#sort");

  const allTags = uniq(projects.flatMap(p => p.tags || [])).sort((a, b) => a.localeCompare(b, "de"));

  let activeTag = "Alle";

  function computeAndRender() {
    const query = norm(q?.value || "");
    const sortKey = sort?.value || "newest";

    let items = [...projects];

    if (activeTag && activeTag !== "Alle") {
      items = items.filter(p => (p.tags || []).includes(activeTag));
    }

    if (query) {
      items = items.filter(p => projectHaystack(p).includes(query));
    }

    items.sort(compareBy(sortKey));

    renderTagChips(allTags, activeTag, (t) => {
      activeTag = t;
      computeAndRender();
    });

    renderGrid(items, (p) => modal.open(p));
  }

  q?.addEventListener("input", computeAndRender);
  sort?.addEventListener("change", computeAndRender);

  computeAndRender();
}

document.addEventListener("DOMContentLoaded", init);
