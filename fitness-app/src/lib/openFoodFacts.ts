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

const FIELDS = [
  "product_name",
  "product_name_de",
  "brands",
  "nutriments",
  "serving_size",
  "image_front_small_url",
].join(",");

/**
 * Looks up a scanned barcode via the Open Food Facts API (free, no key
 * required). Returns null if the product isn't in the database or has no
 * usable per-100g nutrition data.
 */
export async function lookupProductByBarcode(
  barcode: string,
): Promise<ScannedProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Open Food Facts: HTTP ${res.status}`);

  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const n = p.nutriments ?? {};
  const calories = Number(n["energy-kcal_100g"]);
  if (!Number.isFinite(calories)) return null;

  const servingMatch = /([\d.,]+)\s*g/i.exec(String(p.serving_size ?? ""));
  const servingSizeG = servingMatch
    ? Number(servingMatch[1].replace(",", "."))
    : undefined;

  return {
    barcode,
    name: p.product_name_de || p.product_name || "Unbekanntes Produkt",
    brand: p.brands || undefined,
    servingSizeG,
    caloriesPer100g: calories,
    proteinPer100g: Number(n.proteins_100g) || 0,
    carbsPer100g: Number(n.carbohydrates_100g) || 0,
    fatPer100g: Number(n.fat_100g) || 0,
    imageUrl: p.image_front_small_url || undefined,
  };
}
