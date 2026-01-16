(() => {
    const quizEl = document.getElementById("quiz");
    const toastEl = document.getElementById("toast");
    const startBtn = document.getElementById("startBtn");
    const retryBtn = document.getElementById("retryBtn");
    const modeTag = document.getElementById("modeTag");

    const kpiScore = document.getElementById("kpiScore");
    const kpiQ = document.getElementById("kpiQ");
    const kpiChaos = document.getElementById("kpiChaos");

    const canvas = document.getElementById("fx");
    const ctx = canvas.getContext("2d", { alpha: true });

    let score = 0;
    let idx = 0;
    let chaos = 0; // 0..100
    let locked = false;

    // Bedeutungen wie von dir definiert:
    // Palim Palim = unvorhersehbar-lustiges passiert (gleichbedeutend mit Badisch Bahnhof Gleis 3)
    // Den Kollegen keine Eier legen = den anderen kein Bein stellen
    // www.dummgelaufen.ch = blöder Fehler
    // Stand jetzt = jetzt gerade so, später anders

    const QUIZ = [
        {
            q: "Was bedeutet „Den Kollegen keine Eier legen“ im Klartext?",
            answers: [
                "Den anderen kein Bein stellen",
                "Alle sollen mehr Eier essen",
                "Deadline ignorieren",
                "Ticket an HR eskalieren"
            ],
            correct: 0
        },
        {
            q: "„www.dummgelaufen.ch“ steht wofür?",
            answers: [
                "Eine geheime Roche-Website",
                "Einen blöden Fehler gemacht",
                "Alles im Plan",
                "Audit bestanden"
            ],
            correct: 1
        },
        {
            q: "„Stand jetzt“ heißt in Cello-Sprache:",
            answers: [
                "Für immer fix so",
                "Jetzt gerade sieht’s so aus, später war’s anders",
                "Meeting ist abgesagt",
                "Bitte Jira updaten"
            ],
            correct: 1
        },
        {
            q: "„Palim Palim“ ist primär…",
            answers: [
                "ein formales SAP-Modul",
                "ein unvorhersehbares, lustiges Ereignis",
                "ein Schichtmodell",
                "ein Lagerplatz-Code"
            ],
            correct: 1
        },
        {
            q: "„Badisch Bahnhof Gleis 3“ bedeutet in dieser Seite…",
            answers: [
                "Gleiches wie Palim Palim: unvorhersehbarer Spaß-Trigger",
                "Streng verbotenes Wort",
                "Code für Krankmeldung",
                "Der Ort des Audits"
            ],
            correct: 0
        }
    ];

    function shuffle(a) {
        return a
            .map(v => ({ v, r: Math.random() }))
            .sort((x, y) => x.r - y.r)
            .map(x => x.v);
    }

    function resize() {
        canvas.width = Math.floor(window.innerWidth * devicePixelRatio);
        canvas.height = Math.floor(window.innerHeight * devicePixelRatio);
        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    window.addEventListener("resize", resize);
    resize();

    function toast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add("show");
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toastEl.classList.remove("show"), 1500);
    }

    // Mini-Konfetti ohne Lib
    let particles = [];
    let anim = null;

    function confettiBurst(amount = 120) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        for (let i = 0; i < amount; i++) {
            particles.push({
                x: w * (0.2 + Math.random() * 0.6),
                y: h * 0.18,
                vx: (Math.random() - 0.5) * 8,
                vy: 2 + Math.random() * 7,
                g: 0.12 + Math.random() * 0.18,
                r: 3 + Math.random() * 4,
                a: 1,
                rot: Math.random() * Math.PI,
                vr: (Math.random() - 0.5) * 0.22
            });
        }
        if (!anim) anim = requestAnimationFrame(tick);
    }

    function tick() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        particles = particles.filter(p => p.a > 0.02 && p.y < window.innerHeight + 40);

        for (const p of particles) {
            p.vy += p.g;
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vr;
            p.a *= 0.985;

            ctx.save();
            ctx.globalAlpha = p.a;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);

            ctx.fillStyle = `hsl(${Math.floor(Math.random() * 360)}, 85%, 60%)`;
            ctx.fillRect(-p.r, -p.r, p.r * 2.2, p.r * 1.2);

            ctx.restore();
        }

        if (particles.length) {
            anim = requestAnimationFrame(tick);
        } else {
            cancelAnimationFrame(anim);
            anim = null;
        }
    }

    function updateKpis() {
        kpiScore.textContent = String(score);
        kpiQ.textContent = `${Math.min(idx + 1, QUIZ.length)}/${QUIZ.length}`;
        kpiChaos.textContent = `${chaos}%`;
    }

    // Palim Palim / Gleis 3 = unvorhersehbares Event
    function palimEvent() {
        const events = [
            () => { // Glitch + Toast
                document.body.classList.add("glitch");
                setTimeout(() => document.body.classList.remove("glitch"), 550);
                toast("Palim Palim. Governance kurz verloren, Stimmung gewonnen.");
            },
            () => { // Konfetti
                confettiBurst(160);
                toast("Badisch Bahnhof Gleis 3: Unerwarteter Spaß-Release ist live.");
            },
            () => { // Score Twist ("Stand jetzt" real)
                const delta = Math.random() < 0.5 ? -1 : 2;
                score = Math.max(0, score + delta);
                toast(`Stand jetzt: Score wurde ${delta >= 0 ? "hochskaliert" : "re-skaliert"} (${delta}).`);
            },
            () => { // “dummgelaufen” Easter
                toast("www.dummgelaufen.ch – aber als Lessons Learned sauber dokumentiert.");
            }
        ];
        events[Math.floor(Math.random() * events.length)]();
    }

    function maybePalim() {
        // Chaos steigt, Wahrscheinlichkeit steigt. Start: 15%, geht bis ~55%.
        const base = 0.15;
        const extra = (chaos / 100) * 0.40;
        const p = base + extra;

        if (Math.random() < p) palimEvent();
    }

    function renderQuestion() {
        locked = false;
        updateKpis();

        const item = QUIZ[idx];
        quizEl.innerHTML = `
      <div class="qtitle">${item.q}</div>
      <div class="answers">
        ${item.answers.map((a, i) => `
          <button class="answer" data-i="${i}">${a}</button>
        `).join("")}
      </div>
    `;

        quizEl.querySelectorAll(".answer").forEach(btn => {
            btn.addEventListener("click", () => {
                if (locked) return;
                locked = true;

                const choice = Number(btn.getAttribute("data-i"));
                const ok = choice === item.correct;

                // Antwort-Feedback im Enterprise-Ton
                if (ok) {
                    score += 2;
                    chaos = Math.min(100, chaos + 12);
                    modeTag.textContent = "On Track";
                    toast("✔️ Korrekt. Alignment hergestellt. Delivery gesichert.");
                    confettiBurst(70);
                } else {
                    score = Math.max(0, score - 1);
                    chaos = Math.min(100, chaos + 18);
                    modeTag.textContent = "Risiko";
                    toast("❌ Nicht korrekt. www.dummgelaufen.ch – aber wir iterieren.");
                }

                // Palim Palim kann jederzeit passieren
                maybePalim();

                // „Stand jetzt“-Twist: Nach einer Sekunde kann’s anders aussehen
                setTimeout(() => {
                    if (Math.random() < 0.28) {
                        // Kleine Korrektur wie im echten Leben
                        const flip = Math.random() < 0.5 ? -1 : 1;
                        score = Math.max(0, score + flip);
                        toast(`Stand jetzt: Reality-Check. Score ${flip >= 0 ? "+1" : "-1"}.`);
                    }
                    next();
                }, 900);
            });
        });
    }

    function next() {
        idx++;
        updateKpis();

        if (idx >= QUIZ.length) {
            renderResult();
            return;
        }
        renderQuestion();
    }

    function renderResult() {
        modeTag.textContent = "Done";
        updateKpis();

        let verdict = "Solide Performance. Potenzial für Skalierung ist vorhanden.";
        if (score >= 8) verdict = "Bau-41-Ready. Cello würde nicken. Kurz. Effizient.";
        if (score <= 2) verdict = "Risikolog: hoch. Gegenmaßnahme: nochmal durchlaufen (ohne Eier zu legen).";

        quizEl.innerHTML = `
      <div class="qtitle">Ergebnis</div>
      <p style="margin:0 0 10px; color: var(--muted); font-weight:800;">
        Score: ${score} • Palim-Faktor: ${chaos}% • Stand jetzt: abgeschlossen.
      </p>
      <p style="margin:0; line-height:1.5;">
        ${verdict}
      </p>
    `;

        retryBtn.hidden = false;
        startBtn.hidden = true;

        // Abschluss-Palim
        palimEvent();
    }

    function start() {
        score = 0;
        idx = 0;
        chaos = 0;
        modeTag.textContent = "Live";
        retryBtn.hidden = true;
        startBtn.hidden = true;

        // Reihenfolge der Fragen “random”
        shuffle(QUIZ);

        toast("Palim Palim. Quiz ist live. Gleis 3 ist bereit.");
        renderQuestion();
    }

    startBtn.addEventListener("click", start);

    retryBtn.addEventListener("click", () => {
        startBtn.hidden = false;
        retryBtn.hidden = true;
        modeTag.textContent = "Ready";
        quizEl.innerHTML = "";
        toast("Stand jetzt: Reset. Danach sah’s wieder anders aus.");
        updateKpis();
    });

    // Initial KPI
    updateKpis();
})();
