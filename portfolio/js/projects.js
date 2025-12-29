// assets/portfolio/js/projects.js
export async function fetchProjects(API_BASE) {
  const res = await fetch(`${API_BASE}/api/projects`, {
    headers: { "Accept": "application/json" }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }

  const items = await res.json();

  // Backend -> Frontend Shape (damit dein bestehendes UI weiter funktioniert)
  return items.map((p) => ({
    ...p,
    image: p.imageUrl || "",
    links: {
      live: p.liveUrl || null,
      repo: p.repoUrl || null,
    },
  }));
}
