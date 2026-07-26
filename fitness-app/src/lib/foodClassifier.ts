// TensorFlow.js + both models are ~1.5 MB of JS alone (before the model
// weights, fetched separately on .load()). Every import below is dynamic so
// none of it ends up in the main Nutrition bundle — it's fetched only when
// a scan actually needs it, keeping the page light for the vast majority of
// visits that never open the camera/photo flow.

export interface DetectedFood {
  id: string;
  label: string;
  query: string;
  confidence: number;
  estimatedGrams: number;
}

// MobileNet is trained on the 1000 ImageNet classes. Most aren't food, so we
// only keep the ones that are and map them to a clean Open Food Facts search
// term (ImageNet labels are often comma-separated synonyms, e.g.
// "cheeseburger" vs "hotdog, hot dog, red hot").
const IMAGENET_FOOD_LABELS: Record<string, string> = {
  guacamole: "guacamole",
  "hot pot, hotpot": "hot pot",
  trifle: "trifle dessert",
  "ice cream, icecream": "ice cream",
  "ice lolly, lolly, lollipop, popsicle": "popsicle",
  "French loaf": "french bread",
  "bagel, beigel": "bagel",
  pretzel: "pretzel",
  cheeseburger: "cheeseburger",
  "hotdog, hot dog, red hot": "hot dog",
  "mashed potato": "mashed potato",
  "head cabbage": "cabbage",
  broccoli: "broccoli",
  cauliflower: "cauliflower",
  "zucchini, courgette": "zucchini",
  "spaghetti squash": "spaghetti squash",
  "acorn squash": "acorn squash",
  "butternut squash": "butternut squash",
  "cucumber, cuke": "cucumber",
  "artichoke, globe artichoke": "artichoke",
  "bell pepper": "bell pepper",
  cardoon: "cardoon",
  mushroom: "mushroom",
  "Granny Smith": "apple",
  strawberry: "strawberry",
  orange: "orange",
  lemon: "lemon",
  fig: "fig",
  "pineapple, ananas": "pineapple",
  banana: "banana",
  "jackfruit, jak, jack": "jackfruit",
  "custard apple": "custard apple",
  pomegranate: "pomegranate",
  consomme: "consomme soup",
  carbonara: "pasta carbonara",
  "chocolate sauce, chocolate syrup": "chocolate sauce",
  dough: "bread dough",
  "meatloaf, meat loaf": "meatloaf",
  "pizza, pizza pie": "pizza",
  potpie: "pot pie",
  burrito: "burrito",
  "red wine": "red wine",
  espresso: "espresso",
  eggnog: "eggnog",
};

// COCO-SSD's object-detector localizes *multiple* items in one photo (with
// bounding boxes) rather than giving a single whole-image guess — this is
// what lets one photo of a mixed plate turn into several separate results.
const COCO_FOOD_CLASSES: Record<string, string> = {
  banana: "banana",
  apple: "apple",
  sandwich: "sandwich",
  orange: "orange",
  broccoli: "broccoli",
  carrot: "carrot",
  "hot dog": "hot dog",
  pizza: "pizza",
  donut: "donut",
  cake: "cake",
};

async function loadMobilenetImpl() {
  const [, mobilenetLib] = await Promise.all([
    import("@tensorflow/tfjs"),
    import("@tensorflow-models/mobilenet"),
  ]);
  return mobilenetLib.load({ version: 2, alpha: 1.0 });
}

async function loadCocoSsdImpl() {
  const [, cocoSsdLib] = await Promise.all([
    import("@tensorflow/tfjs"),
    import("@tensorflow-models/coco-ssd"),
  ]);
  return cocoSsdLib.load({ base: "mobilenet_v2" });
}

let mobilenetPromise: ReturnType<typeof loadMobilenetImpl> | null = null;
let cocoSsdPromise: ReturnType<typeof loadCocoSsdImpl> | null = null;

function loadMobilenet() {
  if (!mobilenetPromise) mobilenetPromise = loadMobilenetImpl();
  return mobilenetPromise;
}

function loadCocoSsd() {
  if (!cocoSsdPromise) cocoSsdPromise = loadCocoSsdImpl();
  return cocoSsdPromise;
}

/** Warms up both models in the background so the first scan feels instant. */
export function preloadFoodModels() {
  loadMobilenet().catch(() => undefined);
  loadCocoSsd().catch(() => undefined);
}

function flipHorizontally(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0);
  return canvas;
}

function cropToCanvas(
  img: HTMLImageElement,
  [x, y, width, height]: [number, number, number, number],
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, x, y, width, height, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Rough portion estimate from how much of the frame the item fills. */
function estimateGrams(bboxArea: number, imageArea: number): number {
  const ratio = imageArea > 0 ? bboxArea / imageArea : 0.1;
  const grams = Math.round(80 + ratio * 900);
  return Math.min(400, Math.max(40, grams));
}

function bestFoodMatch(
  predictions: Array<{ className: string; probability: number }>,
): { label: string; query: string; confidence: number } | null {
  for (const p of predictions) {
    const query = IMAGENET_FOOD_LABELS[p.className];
    if (query) {
      return { label: p.className.split(",")[0], query, confidence: p.probability };
    }
  }
  return null;
}

/**
 * Detects the foods in a photo using two free, local models (no external
 * API, no cost):
 *  - coco-ssd: object detection, finds and localizes multiple distinct
 *    items in one image with bounding boxes.
 *  - mobilenet: image classification, used both on the full photo (with a
 *    horizontal-flip test-time-augmentation pass averaged in for a bit more
 *    robustness) and on each coco-ssd crop for a finer-grained guess.
 * Results are merged, deduped by search query, and sorted by confidence.
 */
export async function detectFoods(image: HTMLImageElement): Promise<DetectedFood[]> {
  const [mobilenet, cocoSsd] = await Promise.all([loadMobilenet(), loadCocoSsd()]);
  const imageArea = image.naturalWidth * image.naturalHeight;
  const found = new Map<string, DetectedFood>();

  const addCandidate = (label: string, query: string, confidence: number, grams: number) => {
    const existing = found.get(query);
    if (!existing || existing.confidence < confidence) {
      found.set(query, { id: query, label, query, confidence, estimatedGrams: grams });
    }
  };

  // 1) Object detection: multiple localized items with bounding boxes.
  const detections = await cocoSsd.detect(image, 10, 0.4);
  for (const d of detections) {
    const query = COCO_FOOD_CLASSES[d.class];
    if (!query) continue;
    const [, , w, h] = d.bbox;
    addCandidate(d.class, query, d.score, estimateGrams(w * h, imageArea));

    // Refine with a finer-grained classification of just that crop.
    try {
      const crop = cropToCanvas(image, d.bbox);
      const cropPredictions = await mobilenet.classify(crop, 3);
      const refined = bestFoodMatch(cropPredictions);
      if (refined) {
        addCandidate(
          refined.label,
          refined.query,
          Math.max(d.score, refined.confidence),
          estimateGrams(w * h, imageArea),
        );
      }
    } catch {
      // Crop classification is a bonus refinement — ignore failures.
    }
  }

  // 2) Whole-image classification, catches food types outside coco-ssd's 10
  // classes. Averaging the flipped pass in is a standard, well-known way to
  // squeeze a bit more robustness out of a fixed pretrained model.
  const [predictions, flippedPredictions] = await Promise.all([
    mobilenet.classify(image, 5),
    mobilenet.classify(flipHorizontally(image), 5),
  ]);
  const byClass = new Map<string, number>();
  for (const p of predictions) byClass.set(p.className, p.probability);
  for (const p of flippedPredictions) {
    const prior = byClass.get(p.className);
    byClass.set(p.className, prior ? (prior + p.probability) / 2 : p.probability * 0.7);
  }
  const merged = Array.from(byClass.entries())
    .map(([className, probability]) => ({ className, probability }))
    .sort((a, b) => b.probability - a.probability);
  const wholeImageMatch = bestFoodMatch(merged);
  if (wholeImageMatch) {
    addCandidate(
      wholeImageMatch.label,
      wholeImageMatch.query,
      wholeImageMatch.confidence,
      estimateGrams(imageArea * 0.5, imageArea),
    );
  }

  return Array.from(found.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 6);
}
