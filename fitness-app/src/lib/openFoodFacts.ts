export interface ScannedProduct {
  barcode: string;
  name: string;
  brand?: string;
  servingSizeG?: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  imageUrl?: string;
}

const REQUEST_TIMEOUT_MS = 10_000;

// A hanging Open Food Facts response would otherwise leave the barcode/
// search UI stuck indefinitely with no feedback.
function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, {
    headers: { Accept: "application/json" },
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
}

const FIELDS = [
  "code",
  "product_name",
  "product_name_de",
  "brands",
  "nutriments",
  "serving_size",
  "image_front_small_url",
].join(",");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseProduct(p: any, fallbackBarcode?: string): ScannedProduct | null {
  const barcode = String(p.code || fallbackBarcode || "");
  const n = p.nutriments ?? {};
  const calories = Number(n["energy-kcal_100g"]);
  if (!barcode || !Number.isFinite(calories)) return null;

  const servingMatch = /([\d.,]+)\s*g/i.exec(String(p.serving_size ?? ""));
  const servingSizeG = servingMatch
    ? Number(servingMatch[1].replace(",", "."))
    : undefined;

  const brand = Array.isArray(p.brands)
    ? p.brands.join(", ")
    : p.brands || undefined;

  return {
    barcode,
    name: p.product_name_de || p.product_name || "Unbekanntes Produkt",
    brand,
    servingSizeG,
    caloriesPer100g: calories,
    proteinPer100g: Number(n.proteins_100g) || 0,
    carbsPer100g: Number(n.carbohydrates_100g) || 0,
    fatPer100g: Number(n.fat_100g) || 0,
    imageUrl: p.image_front_small_url || undefined,
  };
}

/**
 * Looks up a scanned barcode via the Open Food Facts API (free, no key
 * required). Returns null if the product isn't in the database or has no
 * usable per-100g nutrition data.
 */
export async function lookupProductByBarcode(
  barcode: string,
): Promise<ScannedProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Open Food Facts: HTTP ${res.status}`);

  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  return parseProduct(data.product, barcode);
}

/**
 * Manual fallback for when a barcode can't be scanned or isn't found:
 * search Open Food Facts by product name. Uses the classic search.pl
 * endpoint on the same domain as the product lookup above — the newer
 * search.openfoodfacts.org service doesn't send CORS headers, so it
 * can't be called directly from a browser.
 */
export async function searchProductsByName(
  query: string,
): Promise<ScannedProduct[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(trimmed)}` +
    `&search_simple=1&action=process&json=1&page_size=10&fields=${FIELDS}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Open Food Facts: HTTP ${res.status}`);

  const data = await res.json();
  const products: unknown[] = Array.isArray(data.products) ? data.products : [];
  const seen = new Set<string>();
  const results: ScannedProduct[] = [];
  for (const item of products) {
    const product = parseProduct(item);
    if (product && !seen.has(product.barcode)) {
      seen.add(product.barcode);
      results.push(product);
    }
  }
  return results;
}
