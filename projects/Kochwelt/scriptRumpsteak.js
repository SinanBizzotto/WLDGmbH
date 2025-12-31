// projects/Kochwelt/scriptRumpsteak.js

document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     Zutaten-Rechner (Rumpsteak)
     ========================= */

  const input = document.querySelector(".portionInputRumpsteak");
  const button = document.querySelector(".portionButtonRumpsteak");
  const zutatenList = document.querySelector(".zutatenListeRumpsteak");

  if (input && button && zutatenList) {
    // Message-Element sicher erstellen
    let message = document.querySelector(".portionMessageRumpsteak");
    if (!message) {
      message = document.createElement("span");
      message.className = "portionMessageRumpsteak";
      input.parentNode?.appendChild(message);
    }

    // Originaltexte sichern
    const originalZutaten = Array.from(zutatenList.querySelectorAll("li")).map(
      (li) => li.textContent || ""
    );

    const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

    function parseLeadingNumber(text) {
      // Unterstützt z.B. "2 Steak", "2,5 dl", "2.5 dl" (optional)
      // Wenn du NUR ganze Zahlen willst, sag Bescheid – dann vereinfachen wir das.
      const t = (text || "").trim();
      const m = t.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
      if (!m) return null;

      const amount = Number(m[1].replace(",", "."));
      if (!Number.isFinite(amount)) return null;

      return { amount, rest: m[2] };
    }

    function updateZutaten() {
      let value = Number(String(input.value).replace(",", "."));

      // Ungültige Eingaben abfangen
      if (!Number.isFinite(value)) {
        message.textContent = "Bitte gib eine Zahl zwischen 1 und 20 ein!";
        return;
      }

      // Bereich 1..20
      if (value < 1 || value > 20) {
        message.textContent = "Bitte gib eine Zahl zwischen 1 und 20 ein!";
        value = clamp(value, 1, 20);
        input.value = String(value);
        // weiter rechnen, nachdem wir korrigiert haben
      } else {
        message.textContent = "";
      }

      const lis = zutatenList.querySelectorAll("li");

      lis.forEach((li, i) => {
        const baseText = originalZutaten[i] ?? "";
        const parsed = parseLeadingNumber(baseText);

        if (!parsed) {
          li.textContent = baseText;
          return;
        }

        const newAmount = parsed.amount * value;

        // Anzeige: wenn Ganzzahl -> ohne Nachkommastellen, sonst max 2
        const formatted =
          Number.isInteger(newAmount) ? String(newAmount) : newAmount.toFixed(2).replace(/\.?0+$/, "");

        li.textContent = `${formatted} ${parsed.rest}`.trim();
      });
    }

    // Standardwert 2 Portionen setzen + initial rechnen
    input.value = "2";
    updateZutaten();

    // Nur Button-Klick rechnet (wie bei dir)
    button.addEventListener("click", (e) => {
      e.preventDefault();
      updateZutaten();
    });
  }

  /* =========================
     Kontaktformular (Formspree)
     ========================= */

  const form = document.querySelector(".kontaktForm");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          throw new Error(`Form submit failed: ${res.status}`);
        }

        form.reset();
        form.style.display = "none";

        const msg = document.createElement("div");
        msg.className = "kontaktDanke";
        msg.innerHTML =
          "<h2>Danke für Ihre Nachricht!</h2><p>Wir melden uns bald bei Ihnen.</p>";

        form.parentNode?.appendChild(msg);
      } catch (err) {
        console.error(err);
        alert("Fehler beim Senden. Bitte versuchen Sie es später erneut.");
      }
    });
  }
});
