// assets/portfolio/js/projects.js
export async function fetchProjects() {
  const res = await fetch("./data/projects.json", {
    headers: { "Accept": "application/json" }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Projects JSON error ${res.status}: ${text || res.statusText}`);
  }

  const items = await res.json();

  // Daten liegen jetzt bereits im Frontend-Shape vor
  return items.map((p) => ({
    ...p,
    image: p.image || "",
    links: {
      live: p.links?.live ?? null,
      repo: p.links?.repo ?? null,
    },
  }));
}
