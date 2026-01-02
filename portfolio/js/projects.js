// portfolio/js/projects.js
// Single source of truth for the Portfolio page.
// No backend. No fetch. Pure static data.

export const projects = [
  {
    slug: "band-website",
    title: "Band Website",
    client: "Demo",
    year: 2024,
    status: "Demo",
    type: "Website",
    description: "One-Pager mit Section-Layout, Social Links und sauberen Assets.",
    stack: ["HTML", "CSS"],
    tags: ["Static", "Landingpage"],
    links: {
      live: "../projects/band-website/index.html",
      repo: null,
    },
    image: "./img/preview-band.png",
  },
  {
    slug: "kochwelt",
    title: "Kochwelt",
    client: "Demo",
    year: 2024,
    status: "Demo",
    type: "Website",
    description: "Multi-Page Rezeptseite mit Assets, Navigation und interaktiven Scripts.",
    stack: ["HTML", "CSS", "JavaScript"],
    tags: ["Static", "Multi-Page"],
    links: {
      live: "../projects/Kochwelt/index.html",
      repo: null,
    },
    image: "./img/preview-kochwelt.jpg",
  },
  {
    slug: "sakura-ramen-responsive",
    title: "Sakura Ramen (Responsive)",
    client: "Demo",
    year: 2024,
    status: "Demo",
    type: "Website",
    description: "Responsive Layout-Übung mit klarer Typo, Bildern und Mobile-First Struktur.",
    stack: ["HTML", "CSS"],
    tags: ["Static", "Responsive"],
    links: {
      live: "../projects/sakura-ramen-responsive/index.html",
      repo: null,
    },
    image: "./img/preview-sakura.jpg",
  },
];
