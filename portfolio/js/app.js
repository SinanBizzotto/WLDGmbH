import { projects as rawProjects } from "./projects.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const els = {
  grid: $("#projectGrid") || $("#projects-grid"),
  count: $("#projectCount"),
  search: $("#searchInput") || $("#q"),
  sort: $("#sortSelect") || $("#sort"),
  chips: $("#tagChips"),
  year: $("#year"),
  modal: $("#projectModal"),
  mTitle: $("#mTitle"),
  mMeta: $("#mMeta"),
  mImg: $("#mImg"),
  mDesc: $("#mDesc"),
  mStack: $("#mStack"),
  mTags: $("#mTags"),
  mActions: $("#mActions"),
  modalClose: $("#modalClose"),
};

function escapeHtml(str = "") {
  return String(str).replace(/[&<>“”"']/g, (m) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
      "“": "&quot;",
      "”": "&quot;",
    }[m] || m)
  );
}

function normalizeProject(p) {
  const title = p.title ?? "";
  const description = p.description ?? "";
  const stack = Array.isArray(p.stack) ? p.stack : [];
  const tags = Array.isArray(p.tags) ? p.tags : [];
  const year = Number.isFinite(+p.year) ? +p.year : null;
  const links = p.links ?? {};
  return {
    slug: p.slug ?? (title.toLowerCase().replace(/\s+/g, "-") || "project"),
    title,
    client: p.client ?? "",
    year,
    status: p.status ?? "",
    type: p.type ?? "",
    description,
    stack,
    tags,
    image: p.image ?? "",
    links: {
      live: links.live ?? null,
      repo: links.repo ?? null,
    },
  };
}

const state = {
  q: "",
  tag: "ALL",
  sort: "newest",
};

const projects = (rawProjects || []).map(normalizeProject);

function uniqueTags(items) {
  const set = new Set();
  items.forEach((p) => (p.tags || []).forEach((t) => set.add(String(t))));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function buildTagChips() {
  if (!els.chips) return;

  const tags = uniqueTags(projects);
  const all = ["ALL", ...tags];

  els.chips.innerHTML = all
    .map(
      (t) =>
        `<button class="chip ${t === state.tag ? "is-active" : ""}" data-tag="${escapeHtml(
          t
        )}">${escapeHtml(t === "ALL" ? "Alle" : t)}</button>`
    )
    .join("");

  els.chips.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-tag]");
    if (!btn) return;
    state.tag = btn.dataset.tag;
    $$(".chip").forEach((c) => c.classList.toggle("is-active", c === btn));
    render();
  });
}

function applyFilters(items) {
  let out = [...items];

  if (state.tag && state.tag !== "ALL") {
    out = out.filter((p) => (p.tags || []).map(String).includes(state.tag));
  }

  const q = state.q.trim().toLowerCase();
  if (q) {
    out = out.filter((p) => {
      const hay = [p.title, p.description, p.type, p.client, ...(p.stack || []), ...(p.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  // Sorting
  const byTitle = (a, b) => String(a.title).localeCompare(String(b.title));
  const byYear = (a, b) => (a.year ?? 0) - (b.year ?? 0);

  switch (state.sort) {
    case "oldest":
      out.sort((a, b) => byYear(a, b) || byTitle(a, b));
      break;
    case "title":
      out.sort((a, b) => byTitle(a, b));
      break;
    case "newest":
    default:
      out.sort((a, b) => -byYear(a, b) || byTitle(a, b));
      break;
  }

  return out;
}

function cardHtml(p) {
  const img = p.image
    ? `<img loading="lazy" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}" />`
    : `<div class="thumbPlaceholder" aria-hidden="true"></div>`;

  const metaBits = [p.type, p.year, p.status].filter(Boolean);
  const meta = metaBits.length ? metaBits.join(" • ") : "";

  const tagLine = (p.tags || []).slice(0, 4).map(escapeHtml).join(" · ");

  return `
    <article class="card" data-slug="${escapeHtml(p.slug)}" tabindex="0" role="button" aria-label="${escapeHtml(
      p.title
    )}">
      <div class="thumb">${img}</div>
      <div class="body">
        <div class="meta muted">${escapeHtml(meta)}</div>
        <h3>${escapeHtml(p.title)}</h3>
        <p class="muted clamp2">${escapeHtml(p.description || "")}</p>
        <div class="tagline muted">${escapeHtml(tagLine)}</div>
      </div>
    </article>
  `;
}

function openModal(p) {
  if (!els.modal) return;

  if (els.mTitle) els.mTitle.textContent = p.title || "";
  if (els.mMeta) {
    const metaBits = [p.type, p.year, p.status].filter(Boolean);
    els.mMeta.textContent = metaBits.length ? metaBits.join(" • ") : "";
  }
  if (els.mDesc) els.mDesc.textContent = p.description || "";
  if (els.mStack) els.mStack.textContent = (p.stack || []).join(", ") || "—";
  if (els.mTags) els.mTags.textContent = (p.tags || []).join(" · ") || "—";

  if (els.mImg) {
    if (p.image) {
      els.mImg.src = p.image;
      els.mImg.alt = p.title || "";
      els.mImg.style.display = "block";
    } else {
      els.mImg.removeAttribute("src");
      els.mImg.alt = "";
      els.mImg.style.display = "none";
    }
  }

  if (els.mActions) {
    const a = [];
    if (p.links?.live) a.push(`<a class="btn" href="${escapeHtml(p.links.live)}" target="_blank" rel="noopener">Live</a>`);
    if (p.links?.repo) a.push(`<a class="btn" href="${escapeHtml(p.links.repo)}" target="_blank" rel="noopener">Repo</a>`);
    els.mActions.innerHTML = a.join("");
  }

  els.modal.showModal();
}

function render() {
  if (!els.grid) return;

  const filtered = applyFilters(projects);
  if (els.count) els.count.textContent = String(filtered.length);

  if (filtered.length === 0) {
    els.grid.innerHTML = `<div class="card" style="grid-column:span 12; padding:18px;"><p class="muted" style="margin:0">Keine Treffer.</p></div>`;
    return;
  }

  els.grid.innerHTML = filtered.map(cardHtml).join("");

  els.grid.querySelectorAll("article[data-slug]").forEach((card) => {
    const slug = card.getAttribute("data-slug");
    const p = filtered.find((x) => x.slug === slug);
    if (!p) return;
    const open = () => openModal(p);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });
}

function initControls() {
  // Defaults
  if (els.sort) {
    els.sort.value = state.sort;
    els.sort.addEventListener("change", () => {
      state.sort = els.sort.value;
      render();
    });
  }

  if (els.search) {
    els.search.addEventListener("input", () => {
      state.q = els.search.value || "";
      render();
    });
  }

  if (els.modal && els.modalClose) {
    els.modalClose.addEventListener("click", () => els.modal.close());
    els.modal.addEventListener("click", (e) => {
      const rect = els.modal.getBoundingClientRect();
      const inDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!inDialog) els.modal.close();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && els.modal?.open) els.modal.close();
  });
}

function ensureYear() {
  if (els.year) els.year.textContent = String(new Date().getFullYear());
}

function ensureEmptyStateHint() {
  if (!projects.length && els.grid) {
    els.grid.innerHTML = `
      <div class="card" style="grid-column:span 12; padding:18px;">
        <h3 style="margin-top:0">Noch keine Projekte</h3>
        <p class="muted" style="margin:0">
          Füge Projekte in <code>portfolio/js/projects.js</code> hinzu oder generiere sie mit
          <code>node ./tools/generate-projects.mjs</code>.
        </p>
      </div>
    `;
  }
}

// Boot
ensureYear();
buildTagChips();
initControls();
ensureEmptyStateHint();
render();
