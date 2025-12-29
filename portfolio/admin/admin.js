// portfolio/admin/admin.js

const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);

const API_BASE = isLocal
  ? "http://localhost:8080"
  : "https://api.weblabdesign.ch";

const TOKEN_KEY = "wld_admin_token";

const $ = (sel, root = document) => root.querySelector(sel);

function setStatus(msg) {
  const el = $("#status");
  if (el) el.textContent = msg || "";
}

function showError(el, msg) {
  if (!el) return;
  el.style.display = msg ? "" : "none";
  el.textContent = msg || "";
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function csvToArr(s) {
  return String(s || "")
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);
}

function arrToCsv(a) {
  return Array.isArray(a) ? a.join(", ") : "";
}

async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Accept": "application/json" };

  if (body) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (!token) throw new Error("Kein Token. Bitte neu einloggen.");
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Manche Fehler sind JSON, manche Text
  const text = await res.text().catch(() => "");
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) ||
      text ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

// ---------- LOGIN PAGE ----------
async function initLogin() {
  const form = $("#loginForm");
  if (!form) return;

  // Wenn schon eingeloggt, direkt weiter
  if (getToken()) {
    location.href = "./index.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = $("#user")?.value?.trim();
    const password = $("#password")?.value;

    const errEl = $("#loginError");
    showError(errEl, "");

    try {
      const res = await api("/api/auth/login", {
        method: "POST",
        body: { user, password },
        auth: false,
      });

      if (!res?.token) throw new Error("Login fehlgeschlagen (kein Token).");

      setToken(res.token);
      location.href = "./index.html";
    } catch (err) {
      showError(errEl, String(err.message || err));
    }
  });
}

// ---------- ADMIN PROJECTS PAGE ----------
let projects = [];
let mode = "create"; // create | edit

function projectCard(p) {
  const tags = (p.tags || []).map(t => `<span class="pill">${escapeHtml(t)}</span>`).join("");
  const stack = (p.stack || []).slice(0, 4).map(escapeHtml).join(" • ");

  return `
    <div class="card" style="display:flex; gap:12px; align-items:stretch;">
      <div class="card__media" style="width:160px; min-width:160px;">
        ${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.title)}" loading="lazy" />` : `<div class="card__placeholder"></div>`}
      </div>
      <div class="card__body" style="flex:1;">
        <div class="card__top">
          <h3 style="margin:0;">${escapeHtml(p.title || "")}</h3>
          <span class="badge">${escapeHtml(p.type || "Projekt")}</span>
        </div>
        <p class="muted" style="margin-top:6px;">${escapeHtml(p.description || "")}</p>
        <p class="tiny">${escapeHtml(stack)}</p>
        <div class="card__tags">${tags}</div>

        <div class="card__actions" style="margin-top:10px;">
          <button class="btn btn--primary js-edit" data-slug="${escapeHtml(p.slug)}" type="button">Bearbeiten</button>
          ${p.liveUrl ? `<a class="btn btn--ghost" href="${escapeHtml(p.liveUrl)}" target="_blank" rel="noopener">Live</a>` : ""}
          ${p.repoUrl ? `<a class="btn btn--ghost" href="${escapeHtml(p.repoUrl)}" target="_blank" rel="noopener">Repo</a>` : ""}
        </div>

        <p class="muted tiny" style="margin-top:8px;">
          Slug: <code>${escapeHtml(p.slug)}</code> • ID: <code>${escapeHtml(p.id || "")}</code>
        </p>
      </div>
    </div>
  `;
}

function escapeHtml(str="") {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function setForm(p) {
  $("#slug").value = p?.slug || "";
  $("#title").value = p?.title || "";
  $("#client").value = p?.client || "";
  $("#year").value = p?.year || "";
  $("#statusField").value = p?.status || "";
  $("#type").value = p?.type || "";
  $("#description").value = p?.description || "";
  $("#stack").value = arrToCsv(p?.stack);
  $("#tags").value = arrToCsv(p?.tags);
  $("#liveUrl").value = p?.liveUrl || "";
  $("#repoUrl").value = p?.repoUrl || "";
  $("#imageUrl").value = p?.imageUrl || "";
}

function getFormPayload() {
  const slug = $("#slug").value.trim();
  const payload = {
    slug,
    title: $("#title").value.trim(),
    client: $("#client").value.trim() || null,
    year: $("#year").value ? Number($("#year").value) : null,
    status: $("#statusField").value.trim() || null,
    type: $("#type").value.trim() || null,
    description: $("#description").value.trim() || null,
    stack: csvToArr($("#stack").value),
    tags: csvToArr($("#tags").value),
    liveUrl: $("#liveUrl").value.trim() || null,
    repoUrl: $("#repoUrl").value.trim() || null,
    imageUrl: $("#imageUrl").value.trim() || null,
  };

  if (!payload.slug) throw new Error("Slug ist Pflicht.");
  if (!payload.title) throw new Error("Titel ist Pflicht.");
  return payload;
}

async function loadProjects(q="") {
  setStatus(`API: ${API_BASE} • Lade Projekte …`);

  // GET ist bei dir öffentlich, aber fürs Admin-Listing ist das ok
  const list = await api("/api/projects", { method: "GET", auth: false });

  const query = q.trim().toLowerCase();
  projects = (Array.isArray(list) ? list : []).filter(p => {
    if (!query) return true;
    const hay = [
      p.slug, p.title, p.client, p.type, p.description,
      ...(p.tags||[]), ...(p.stack||[])
    ].join(" ").toLowerCase();
    return hay.includes(query);
  });

  renderList();
  setStatus(`API: ${API_BASE} • ${projects.length} Projekte geladen.`);
}

function renderList() {
  const el = $("#list");
  if (!el) return;
  el.innerHTML = projects.map(projectCard).join("");

  el.querySelectorAll(".js-edit").forEach(btn => {
    btn.addEventListener("click", () => {
      const slug = btn.dataset.slug;
      const p = projects.find(x => x.slug === slug);
      openEditor("edit", p);
    });
  });
}

function openEditor(newMode, p) {
  mode = newMode;
  const dlg = $("#editModal");
  if (!dlg) return;

  showError($("#formError"), "");

  if (mode === "create") {
    $("#mTitle").textContent = "Neues Projekt";
    $("#mSub").textContent = "Create";
    $("#deleteBtn").style.display = "none";
    setForm(null);
    $("#slug").disabled = false;
  } else {
    $("#mTitle").textContent = "Projekt bearbeiten";
    $("#mSub").textContent = "Update / Delete";
    $("#deleteBtn").style.display = "";
    setForm(p);
    $("#slug").disabled = true; // slug als key nicht anfassen
  }

  dlg.showModal();
}

async function handleSave(e) {
  e.preventDefault();
  showError($("#formError"), "");

  try {
    const payload = getFormPayload();

    if (mode === "create") {
      // POST /api/projects
      await api("/api/projects", { method: "POST", body: payload, auth: true });
    } else {
      // PUT /api/projects/:slug (falls vorhanden)
      await api(`/api/projects/${encodeURIComponent(payload.slug)}`, { method: "PUT", body: payload, auth: true });
    }

    $("#editModal").close();
    await loadProjects($("#q")?.value || "");
  } catch (err) {
    showError($("#formError"), String(err.message || err));
  }
}

async function handleDelete() {
  showError($("#formError"), "");

  const slug = $("#slug").value.trim();
  if (!slug) return;

  const ok = confirm(`Projekt wirklich löschen?\n\nSlug: ${slug}`);
  if (!ok) return;

  try {
    // DELETE /api/projects/:slug (falls vorhanden)
    await api(`/api/projects/${encodeURIComponent(slug)}`, { method: "DELETE", auth: true });
    $("#editModal").close();
    await loadProjects($("#q")?.value || "");
  } catch (err) {
    showError($("#formError"), String(err.message || err));
  }
}

async function initAdmin() {
  const logoutBtn = $("#logoutBtn");
  if (!logoutBtn) return;

  // Access Gate
  if (!getToken()) {
    location.href = "./login.html";
    return;
  }

  logoutBtn.addEventListener("click", () => {
    clearToken();
    location.href = "./login.html";
  });

  $("#newBtn")?.addEventListener("click", () => openEditor("create"));
  $("#refreshBtn")?.addEventListener("click", () => loadProjects($("#q")?.value || ""));

  $("#q")?.addEventListener("input", (e) => {
    loadProjects(e.target.value || "");
  });

  $("#modalClose")?.addEventListener("click", () => $("#editModal")?.close());
  $("#cancelBtn")?.addEventListener("click", () => $("#editModal")?.close());
  $("#editModal")?.addEventListener("click", (e) => {
    if (e.target?.id === "editModal") $("#editModal").close();
  });

  $("#editForm")?.addEventListener("submit", handleSave);
  $("#deleteBtn")?.addEventListener("click", handleDelete);

  // Initial load
  try {
    await loadProjects("");
  } catch (err) {
    setStatus(`API: ${API_BASE} • Fehler beim Laden.`);
    alert(`Admin konnte Projekte nicht laden:\n${err.message || err}`);
  }
}

// Boot
initLogin();
initAdmin();
