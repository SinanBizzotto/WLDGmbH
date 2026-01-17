// WebLabDesignFrontend/js/app.js
// Frontend-only Interactions: Pricing toggle, configurator, estimator, contact UX.

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function setYear() {
  const el = qs('#year');
  if (el) el.textContent = String(new Date().getFullYear());
}

function formatCHF(n) {
  // Lightweight CHF formatting (no i18n dependency)
  const rounded = Math.round(n);
  const s = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, "’");
  return `${s} CHF`;
}

// ---------- Mobile Nav (Hamburger) ----------
function initMobileNav() {
  const nav = qs(".nav");
  const toggle = qs(".navToggle") || qs("[data-nav-toggle]");
  if (!nav || !toggle) return;

  const mq = window.matchMedia("(max-width: 980px)");

  const close = () => {
    nav.classList.remove("isOpen");
    toggle.setAttribute("aria-expanded", "false");
  };

  const toggleNav = (e) => {
    // hard stop: sonst schließt der document-click handler direkt wieder
    e.preventDefault();
    e.stopPropagation();

    const isOpen = nav.classList.toggle("isOpen");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  };

  toggle.addEventListener("click", toggleNav);

  // Klick auf Menüpunkt -> im Mobile wieder schließen
  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      if (mq.matches) close();
    });
  });

  // Klick außerhalb -> schließen
  document.addEventListener("click", (e) => {
    if (!nav.classList.contains("isOpen")) return;
    if (nav.contains(e.target) || toggle.contains(e.target)) return;
    close();
  });

  // ESC -> schließen
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // Beim Resize auf Desktop -> Zustand bereinigen
  window.addEventListener("resize", () => {
    if (!mq.matches) close();
  });
}

// ---------- Pricing toggle (Einmalig <-> Monatlich) ----------
function initPricingToggle() {
  const btn = qs('#priceToggle');
  if (!btn) return;

  const values = qsa('.price__value');

  const apply = (monthly) => {
    btn.setAttribute('aria-pressed', monthly ? 'true' : 'false');
    values.forEach((el) => {
      const once = el.getAttribute('data-once');
      const monthlyVal = el.getAttribute('data-monthly');
      el.textContent = monthly ? (monthlyVal || el.textContent) : (once || el.textContent);
    });
  };

  // Initial state: once
  apply(false);

  btn.addEventListener('click', () => {
    const current = btn.getAttribute('aria-pressed') === 'true';
    apply(!current);
  });
}

// ---------- "Dieses Paket wählen" -> Kontaktformular ----------
function initPlanSelectButtons() {
  const select = qs('#planSelect');
  if (!select) return;

  qsa('.selectPlan').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('[data-plan]');
      const plan = card?.getAttribute('data-plan') || '';
      if (plan) select.value = plan;

      // Scroll to contact
      const contact = qs('#kontakt');
      if (contact) contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ---------- Paket-Finder ----------
function initFinder() {
  const form = qs('#finderForm');
  const out = qs('#finderResult');
  const planSelect = qs('#planSelect');
  if (!form || !out) return;

  function recommend(values) {
    const auth = values.auth === 'yes';
    const db = values.db === 'yes';
    const hosting = values.hosting === 'yes';
    const pages = values.pages || '1-3';

    let plan = 'frontend';
    if (auth || db) plan = 'fullstack';
    else if (hosting) plan = 'frontend_hosting';

    // Rough timeline heuristic
    const pageFactor = ({
      '1-3': 1,
      '4-6': 1.4,
      '7-10': 1.9,
      '10+': 2.6,
    })[pages] ?? 1.4;

    const baseWeeks = plan === 'fullstack' ? 4 : plan === 'frontend_hosting' ? 2.5 : 2;
    const weeks = Math.max(2, Math.round(baseWeeks * pageFactor));

    // Rough budget heuristic
    const onceBase = plan === 'fullstack' ? 6900 : plan === 'frontend_hosting' ? 3400 : 2500;
    const onceHi = Math.round(onceBase * (1.25 + (pageFactor - 1) * 0.35));
    const onceLo = Math.round(onceBase * (0.95 + (pageFactor - 1) * 0.2));

    const monthlyBase = plan === 'fullstack' ? 990 : plan === 'frontend_hosting' ? 590 : 390;

    return { plan, pages, weeks, onceLo, onceHi, monthlyBase };
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const vals = Object.fromEntries(fd.entries());
    const r = recommend(vals);

    const label = r.plan === 'fullstack'
      ? 'Full-Stack'
      : r.plan === 'frontend_hosting'
        ? 'Frontend + Hosting'
        : 'Frontend';

    out.innerHTML = `
      <div class="pill" style="display:inline-block;margin-bottom:8px;">Empfehlung: <strong>${label}</strong></div>
      <div class="muted">Budget (einmalig): <strong>${formatCHF(r.onceLo)} – ${formatCHF(r.onceHi)}</strong></div>
      <div class="muted">Betrieb/Wartung (monatlich): <strong>ab ${formatCHF(r.monthlyBase)}</strong></div>
      <div class="muted">Timeline: <strong>${r.weeks} Wochen</strong></div>
      <div style="margin-top:10px;"> <button class="btn btn--ghost" type="button" id="finderApply">In Kontaktformular übernehmen</button></div>
    `;

    const applyBtn = qs('#finderApply', out);
    applyBtn?.addEventListener('click', () => {
      if (planSelect) planSelect.value = r.plan;
      const msg = qs('textarea[name="message"]');
      if (msg) {
        msg.value = `Empfehlung (Konfigurator): ${label}\nSeiten: ${r.pages}\nBudget einmalig: ${formatCHF(r.onceLo)} – ${formatCHF(r.onceHi)}\nMonatlich: ab ${formatCHF(r.monthlyBase)}\nTimeline: ca. ${r.weeks} Wochen\n\nKurzbeschreibung:`;
        msg.focus();
      }
      const contact = qs('#kontakt');
      if (contact) contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ---------- Budget Estimator ----------
function initEstimator() {
  const wrap = qs('#estimator');
  if (!wrap) return;

  const pages = qs('#estPages');
  const pagesVal = qs('#estPagesVal');
  const onceOut = qs('#estOnce');
  const monthlyOut = qs('#estMonthly');
  const timelineOut = qs('#estTimeline');
  const applyBtn = qs('#applyToContact');
  const planSelect = qs('#planSelect');

  const flags = {
    seo: qs('#estSEO'),
    forms: qs('#estForms'),
    multi: qs('#estMulti'),
    hosting: qs('#estHosting'),
    backend: qs('#estBackend'),
  };

  function calc() {
    const p = Number(pages?.value || 5);
    if (pagesVal) pagesVal.textContent = String(p);

    // Base model (simple, predictable)
    let base = 1500 + p * 450;
    if (flags.seo?.checked) base += 350;
    if (flags.forms?.checked) base += 450;
    if (flags.multi?.checked) base += 900;
    if (flags.backend?.checked) base += 3200;

    // Range
    const lo = Math.round(base * 0.9);
    const hi = Math.round(base * 1.25);

    // Monthly operating (only if hosting/back-end)
    let monthly = 0;
    if (flags.hosting?.checked) monthly += 290;
    if (flags.backend?.checked) monthly += 350;
    if (monthly > 0) monthly = Math.max(monthly, 390);

    // Timeline heuristic
    let weeks = 2 + Math.ceil(p / 3);
    if (flags.multi?.checked) weeks += 1;
    if (flags.backend?.checked) weeks += 3;
    weeks = Math.min(Math.max(weeks, 2), 16);

    if (onceOut) onceOut.textContent = `${formatCHF(lo)} – ${formatCHF(hi)}`;
    if (monthlyOut) monthlyOut.textContent = monthly > 0 ? `ab ${formatCHF(monthly)}` : '—';
    if (timelineOut) timelineOut.textContent = `${weeks}–${weeks + 1} Wochen`;

    let plan = 'frontend';
    if (flags.backend?.checked) plan = 'fullstack';
    else if (flags.hosting?.checked) plan = 'frontend_hosting';

    return { p, lo, hi, monthly, weeks, plan };
  }

  const rerun = () => calc();
  pages?.addEventListener('input', rerun);
  Object.values(flags).forEach((c) => c?.addEventListener('change', rerun));
  calc();

  applyBtn?.addEventListener('click', () => {
    const s = calc();
    if (planSelect) planSelect.value = s.plan;

    const label = s.plan === 'fullstack'
      ? 'Full-Stack'
      : s.plan === 'frontend_hosting'
        ? 'Frontend + Hosting'
        : 'Frontend';

    const msg = qs('textarea[name="message"]');
    if (msg) {
      msg.value = `Budget-Estimator:\nPlan: ${label}\nSeiten: ${s.p}\nEinmalig (Range): ${formatCHF(s.lo)} – ${formatCHF(s.hi)}\nMonatlich: ${s.monthly > 0 ? 'ab ' + formatCHF(s.monthly) : '—'}\nTimeline: ${s.weeks}–${s.weeks + 1} Wochen\n\nKurzbeschreibung:`;
      msg.focus();
    }
    const contact = qs('#kontakt');
    if (contact) contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// ---------- Contact form (Formspree) UX ----------
function initContactForm() {
  const form = qs('#contactForm');
  if (!form) return;

  const status = qs('#formStatus');
  const thankyou = qs('#thankyou');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (status) status.textContent = 'Sende…';

    try {
      const fd = new FormData(form);
      const res = await fetch(form.action, {
        method: 'POST',
        body: fd,
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      if (status) status.textContent = 'Gesendet.';
      if (thankyou) thankyou.hidden = false;
      form.reset();
    } catch (err) {
      console.error(err);
      if (status) status.textContent = 'Senden fehlgeschlagen. Bitte nochmal versuchen oder direkt per Mail kontaktieren.';
      try { form.submit(); } catch { /* ignore */ }
    }
  });
}

// ---------- Boot ----------
document.addEventListener('DOMContentLoaded', () => {
  setYear();
  initMobileNav();
  initPricingToggle();
  initPlanSelectButtons();
  initFinder();
  initEstimator();
  initContactForm();
});
