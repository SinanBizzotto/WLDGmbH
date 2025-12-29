import { fetchProjects } from "./projects.js";

const API_BASE =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:8080"
    : "https://api.weblabdesign.ch";


const $ = (sel, root = document) => root.querySelector(sel);

const state = {
  q: "",
  tag: "all",
  sort: "newest",
};

let projects = [];

function uniq(arr) {
  return [...new Set(arr)].filter(Boolean);
}

function bySort(list) {
  const out = [...list];
  if (state.sort === "title") {
    out.sort((a, b) => (a.title || "").localeCompare(b.title || "", "de"));
  } else if (state.sort === "oldest") {
    out.sort((a, b) => (a.year || 0) - (b.year || 0));
  } else {
    out.sort((a, b) => (b.year || 0) - (a.year || 0));
  }
  return out;
}

function filterList() {
  const q = state.q.trim().toLowerCase();
  return projects.filter((p) => {
    const hay = [
      p.title,
      p.client,
      p.type,
      p.description,
      ...(p.stack || []),
      ...(p.tags || []),
    ]
      .join(" ")
      .toLowerCase();

    const qOk = !q || hay.includes(q);
    const tOk = state.tag === "all" || (p.tags || []).includes(state.tag);
    return qOk && tOk;
  });
}

function renderTags() {
  const tags = uniq(projects.flatMap((p) => p.tags || [])).sort((a, b) =>
    a.localeCompare(b, "de")
  );
  const wrap = $("#tagChips");
  if (!wrap) return;

  wrap.innerHTML = "";

  const mk = (label, value) => {
    const btn = document.createElement("button");
    btn.className = "chip" + (state.tag === value ? " is-active" : "");
    btn.type = "button";
    btn.textContent = label;
    btn.addEventListener("click", () => {
      state.tag = value;
      render();
    });
    wrap.appendChild(btn);
  };

  mk("Alle", "all");
  tags.forEach((t) => mk(t, t));
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cardTemplate(p) {
  const live = p.links?.live;
  const repo = p.links?.repo;
  const tags = (p.tags || []).map((t) => `<span class="pill">${escapeHtml(t)}</span>`).join("");
  const stack = (p.stack || []).slice(0, 4).map(escapeHtml).join(" • ");

  return `
  <article class="card" data-slug="${escapeHtml(p.slug)}">
    <div class="card__media">
      ${p.image
      ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)} Preview" loading="lazy" />`
      : `<div class="card__placeholder"></div>`
    }
    </div>
    <div class="card__body">
      <div class="card__top">
        <h3>${escapeHtml(p.title)}</h3>
        <span class="badge">${escapeHtml(p.type || "Projekt")}</span>
      </div>
      <p class="muted">${escapeHtml(p.description || "")}</p>
      <p class="tiny">${escapeHtml(stack)}</p>
      <div class="card__tags">${tags}</div>
      <div class="card__actions">
        ${live
      ? `<a class="btn btn--primary" href="${escapeHtml(live)}" target="_blank" rel="noopener">Live</a>`
      : ""
    }
        ${repo
      ? `<a class="btn btn--ghost" href="${escapeHtml(repo)}" target="_blank" rel="noopener">Code</a>`
      : ""
    }
        <button class="btn btn--ghost js-details" type="button">Details</button>
      </div>
    </div>
  </article>`;
}

function render() {
  const chips = $("#tagChips");
  if (chips) {
    if (!chips.dataset.ready) {
      renderTags();
      chips.dataset.ready = "1";
    } else {
      [...chips.querySelectorAll(".chip")].forEach((btn) => {
        btn.classList.toggle(
          "is-active",
          (btn.textContent === "Alle" && state.tag === "all") ||
          btn.textContent === state.tag
        );
      });
    }
  }

  const list = bySort(filterList());

  const count = $("#projectCount");
  if (count) count.textContent = String(list.length);

  const grid = $("#projectGrid");
  if (!grid) return;

  grid.innerHTML = list.map(cardTemplate).join("");

  grid.querySelectorAll(".js-details").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".card");
      const slug = card?.dataset.slug;
      const p = projects.find((x) => x.slug === slug);
      if (p) openModal(p);
    });
  });
}

function openModal(p) {
  const dlg = $("#projectModal");
  if (!dlg) return;

  $("#mTitle").textContent = p.title || "";
  $("#mMeta").textContent = `${p.type || "Projekt"} • ${p.year || ""} • ${p.client || ""
    }`.replace(/\s•\s$/g, "").replace(/\s•\s•/g, " • ");

  $("#mDesc").textContent = p.description || "";

  const tags = (p.tags || []).map((t) => `<span class="pill">${escapeHtml(t)}</span>`).join("");
  $("#mTags").innerHTML = tags || '<span class="muted">—</span>';
  $("#mStack").textContent = (p.stack || []).join(" • ") || "—";

  const live = p.links?.live;
  const repo = p.links?.repo;

  const actions = [];
  if (live) actions.push(`<a class="btn btn--primary" href="${escapeHtml(live)}" target="_blank" rel="noopener">Live öffnen</a>`);
  if (repo) actions.push(`<a class="btn btn--ghost" href="${escapeHtml(repo)}" target="_blank" rel="noopener">Code ansehen</a>`);
  $("#mActions").innerHTML = actions.join("") || '<span class="muted">Keine Links hinterlegt.</span>';

  const img = $("#mImg");
  if (img) {
    if (p.image) {
      img.src = p.image;
      img.alt = (p.title || "") + " Preview";
      img.style.display = "";
    } else {
      img.style.display = "none";
    }
  }

  dlg.showModal();
}

function showApiError(err) {
  const grid = $("#projectGrid");
  if (!grid) return;

  grid.innerHTML = `
    <div class="notice">
      <strong>Projekte konnten nicht geladen werden.</strong>
      <div class="muted">API: ${escapeHtml(API_BASE)}</div>
      <div class="muted">${escapeHtml(err?.message || "Unbekannter Fehler")}</div>
    </div>
  `;
}

async function init() {
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  const q = $("#q");
  if (q) {
    q.addEventListener("input", (e) => {
      state.q = e.target.value;
      render();
    });
  }

  const sort = $("#sort");
  if (sort) {
    sort.addEventListener("change", (e) => {
      state.sort = e.target.value;
      render();
    });
  }

  const modalClose = $("#modalClose");
  if (modalClose) modalClose.addEventListener("click", () => $("#projectModal")?.close());

  const modal = $("#projectModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target?.id === "projectModal") modal.close();
    });
  }

  try {
    projects = await fetchProjects(API_BASE);

    // Tags neu berechnen
    const chips = $("#tagChips");
    if (chips) delete chips.dataset.ready;

    render();
  } catch (err) {
    console.error(err);
    showApiError(err);
  }
}

init();
