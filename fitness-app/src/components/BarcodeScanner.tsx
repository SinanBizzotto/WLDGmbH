import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import {
  AlertCircle,
  Camera,
  Flame,
  Flashlight,
  FlashlightOff,
  ScanLine,
  Search,
  X,
} from "lucide-react";
import {
  lookupProductByBarcode,
  searchProductsByName,
  type ScannedProduct,
} from "../lib/openFoodFacts";
import { detectFoods, preloadFoodModels, type DetectedFood } from "../lib/foodClassifier";
import { useModalA11y } from "./ui";

type ScanState =
  | { phase: "scanning" }
  | { phase: "looking-up"; barcode: string }
  | { phase: "found"; product: ScannedProduct }
  | { phase: "not-found"; barcode: string }
  | { phase: "camera-error"; message: string }
  | { phase: "search" }
  | { phase: "photo-analyzing" }
  | { phase: "photo-empty" }
  | { phase: "photo-items" }
  | { phase: "photo-matching" }
  | { phase: "photo-review" };

export interface ScannedMeal {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  barcode: string;
  grams: number;
  brand?: string;
  imageUrl?: string;
}

interface BarcodeScannerProps {
  onClose: () => void;
  onConfirm: (meal: ScannedMeal) => void;
}

interface ScannerControls {
  stop: () => void;
  switchTorch?: (onOff: boolean) => Promise<void>;
}

interface PhotoItem extends DetectedFood {
  included: boolean;
  grams: number;
}

interface PhotoMatch {
  item: PhotoItem;
  product: ScannedProduct | null;
}

const HINTS = new Map();
HINTS.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
]);

function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
    img.src = URL.createObjectURL(file);
  });
}

export default function BarcodeScanner({
  onClose,
  onConfirm,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const [state, setState] = useState<ScanState>({ phase: "scanning" });
  const [grams, setGrams] = useState(100);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ScannedProduct[] | null>(
    null,
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([]);
  const [photoMatches, setPhotoMatches] = useState<PhotoMatch[]>([]);
  const [photoMealName, setPhotoMealName] = useState("");

  useEffect(() => {
    // Warm the ML models up as soon as the scanner opens so the photo path
    // (if the user picks it) doesn't wait for the ~15 MB download on top of
    // camera + product lookups.
    preloadFoodModels();
  }, []);

  useEffect(() => {
    if (state.phase !== "scanning") return;
    let cancelled = false;
    setTorchOn(false);
    setTorchSupported(false);
    const reader = new BrowserMultiFormatReader(HINTS);

    reader
      .decodeFromVideoDevice(
        undefined,
        videoRef.current ?? undefined,
        (result, _error, controls) => {
          controlsRef.current = controls;
          setTorchSupported(Boolean(controls.switchTorch));
          if (cancelled || !result) return;
          controls.stop();
          setState({ phase: "looking-up", barcode: result.getText() });
        },
      )
      .catch((err: unknown) => {
        if (cancelled) return;
        const name = err instanceof Error ? err.name : "";
        setState({
          phase: "camera-error",
          message:
            name === "NotAllowedError"
              ? "Kamera-Zugriff wurde verweigert. Bitte in den Browser-Einstellungen erlauben."
              : "Kamera konnte nicht gestartet werden.",
        });
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== "looking-up") return;
    let cancelled = false;
    lookupProductByBarcode(state.barcode)
      .then((product) => {
        if (cancelled) return;
        if (product) {
          setGrams(Math.round(product.servingSizeG ?? 100));
          setState({ phase: "found", product });
        } else {
          setState({ phase: "not-found", barcode: state.barcode });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ phase: "not-found", barcode: state.barcode });
      });
    return () => {
      cancelled = true;
    };
  }, [state]);

  // Belt-and-suspenders: release the camera if the component unmounts
  // mid-scan (e.g. the user closes the modal while phase is "scanning").
  useEffect(() => () => controlsRef.current?.stop(), []);

  const scale = (per100g: number) => Math.round((per100g * grams) / 100);

  const toggleTorch = () => {
    const next = !torchOn;
    controlsRef.current?.switchTorch?.(next).catch(() => undefined);
    setTorchOn(next);
  };

  const runSearch = async () => {
    setSearchLoading(true);
    setSearchError(null);
    try {
      setSearchResults(await searchProductsByName(searchQuery));
    } catch {
      setSearchError("Suche fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setSearchLoading(false);
    }
  };

  const pickProduct = (product: ScannedProduct) => {
    setGrams(Math.round(product.servingSizeG ?? 100));
    setState({ phase: "found", product });
  };

  const onPhotoSelected = async (file: File) => {
    setState({ phase: "photo-analyzing" });
    let objectUrl: string | undefined;
    try {
      const img = await loadImageFile(file);
      objectUrl = img.src;
      const detected = await detectFoods(img);
      if (detected.length === 0) {
        setState({ phase: "photo-empty" });
        return;
      }
      setPhotoItems(
        detected.map((d) => ({ ...d, included: true, grams: d.estimatedGrams })),
      );
      setState({ phase: "photo-items" });
    } catch {
      setState({ phase: "photo-empty" });
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  };

  const runPhotoMatching = async () => {
    const included = photoItems.filter((i) => i.included);
    setState({ phase: "photo-matching" });
    const matches: PhotoMatch[] = await Promise.all(
      included.map(async (item) => {
        try {
          const results = await searchProductsByName(item.query);
          return { item, product: results[0] ?? null };
        } catch {
          return { item, product: null };
        }
      }),
    );
    setPhotoMatches(matches);
    setPhotoMealName(included.map((i) => i.label).join(", "));
    setState({ phase: "photo-review" });
  };

  const dialogRef = useModalA11y<HTMLDivElement>(true, onClose);

  const matchedTotals = photoMatches.reduce(
    (sum, m) => {
      if (!m.product) return sum;
      const factor = m.item.grams / 100;
      return {
        calories: sum.calories + Math.round(m.product.caloriesPer100g * factor),
        proteinG: sum.proteinG + Math.round(m.product.proteinPer100g * factor),
        carbsG: sum.carbsG + Math.round(m.product.carbsPer100g * factor),
        fatG: sum.fatG + Math.round(m.product.fatPer100g * factor),
        totalGrams: sum.totalGrams + m.item.grams,
      };
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, totalGrams: 0 },
  );

  return (
    <div
      className="modal"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void onPhotoSelected(file);
        }}
      />
      <div
        className="dialog scanner-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scanner-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <button
          type="button"
          className="dialog-close"
          onClick={onClose}
          aria-label="Schliessen"
        >
          <X />
        </button>
        <p className="dialog-kicker">PRODUKT SCANNEN</p>
        <h2 id="scanner-title">Barcode scannen</h2>

        {state.phase === "scanning" && (
          <div className="scanner-view">
            <video ref={videoRef} muted playsInline />
            <div className="scanner-frame" aria-hidden="true" />
            {torchSupported && (
              <button
                type="button"
                className="scanner-torch"
                onClick={toggleTorch}
                aria-pressed={torchOn}
                aria-label="Taschenlampe umschalten"
              >
                {torchOn ? <FlashlightOff /> : <Flashlight />}
              </button>
            )}
            <p className="dialog-hint">
              Halte den Barcode der Verpackung vor die Kamera.
            </p>
            <div className="scanner-linkrow">
              <button
                type="button"
                className="scanner-link"
                onClick={() => setState({ phase: "search" })}
              >
                <Search size={13} /> Produkt manuell suchen
              </button>
              <button
                type="button"
                className="scanner-link"
                onClick={() => photoInputRef.current?.click()}
              >
                <Camera size={13} /> Mahlzeit fotografieren
              </button>
            </div>
          </div>
        )}

        {state.phase === "looking-up" && (
          <div className="scanner-status">
            <ScanLine className="scanner-status__icon scanner-status__icon--spin" />
            <p>Produkt wird gesucht…</p>
          </div>
        )}

        {state.phase === "photo-analyzing" && (
          <div className="scanner-status">
            <Camera className="scanner-status__icon scanner-status__icon--spin" />
            <p>Foto wird analysiert…</p>
            <p className="dialog-hint">
              Erkennung läuft direkt im Browser, das kann beim ersten Mal ein
              paar Sekunden dauern.
            </p>
          </div>
        )}

        {state.phase === "photo-matching" && (
          <div className="scanner-status">
            <ScanLine className="scanner-status__icon scanner-status__icon--spin" />
            <p>Nährwerte werden gesucht…</p>
          </div>
        )}

        {state.phase === "photo-empty" && (
          <div className="scanner-status">
            <AlertCircle className="scanner-status__icon" />
            <p>
              Konnte auf dem Foto nichts Essbares erkennen. Die Erkennung ist
              ein einfaches, kostenloses Modell und kennt nur gängige
              Grundzutaten/Gerichte — versuch ein anderes Foto oder such
              manuell.
            </p>
            <div className="dialog__actions" style={{ justifyContent: "center" }}>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => photoInputRef.current?.click()}
              >
                <Camera size={14} /> Anderes Foto
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setState({ phase: "search" })}
              >
                <Search size={14} /> Suchen
              </button>
            </div>
          </div>
        )}

        {state.phase === "camera-error" && (
          <div className="scanner-status">
            <AlertCircle className="scanner-status__icon" />
            <p>{state.message}</p>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setState({ phase: "search" })}
            >
              <Search size={14} /> Stattdessen suchen
            </button>
          </div>
        )}

        {state.phase === "not-found" && (
          <div className="scanner-status">
            <AlertCircle className="scanner-status__icon" />
            <p>
              Kein Produkt zu diesem Barcode gefunden ({state.barcode}).
            </p>
            <div className="dialog__actions" style={{ justifyContent: "center" }}>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setState({ phase: "scanning" })}
              >
                Erneut scannen
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setState({ phase: "search" })}
              >
                <Search size={14} /> Suchen
              </button>
            </div>
          </div>
        )}

        {state.phase === "search" && (
          <div className="scanner-search">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void runSearch();
              }}
            >
              <input
                type="search"
                placeholder="Produktname eingeben…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="button button--secondary"
                disabled={searchLoading || !searchQuery.trim()}
              >
                <Search size={16} /> Suchen
              </button>
            </form>
            {searchLoading && <p className="dialog-hint">Suche läuft…</p>}
            {searchError && <p className="dialog-hint">{searchError}</p>}
            {searchResults && searchResults.length === 0 && !searchLoading && (
              <p className="dialog-hint">Keine Treffer. Versuch einen anderen Suchbegriff.</p>
            )}
            {searchResults && searchResults.length > 0 && (
              <ul className="scanner-search__results">
                {searchResults.map((product) => (
                  <li key={product.barcode}>
                    <button type="button" onClick={() => pickProduct(product)}>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt="" />
                      ) : (
                        <span className="scanner-search__placeholder" />
                      )}
                      <span>
                        <strong>{product.name}</strong>
                        {product.brand && <small>{product.brand}</small>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className="scanner-link"
              onClick={() => setState({ phase: "scanning" })}
            >
              <ScanLine size={13} /> Stattdessen scannen
            </button>
          </div>
        )}

        {state.phase === "photo-items" && (
          <div className="scanner-photo-items">
            <p className="dialog-hint">
              Erkannt (Menge geschätzt, bitte prüfen und anpassen):
            </p>
            <ul className="scanner-photo-items__list">
              {photoItems.map((item, index) => (
                <li key={item.id}>
                  <label className="scanner-photo-items__check">
                    <input
                      type="checkbox"
                      checked={item.included}
                      onChange={(e) =>
                        setPhotoItems((current) =>
                          current.map((it, i) =>
                            i === index ? { ...it, included: e.target.checked } : it,
                          ),
                        )
                      }
                    />
                    <span>
                      <strong>{item.label}</strong>
                      <small>{Math.round(item.confidence * 100)}% sicher</small>
                    </span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="scanner-photo-items__grams"
                    value={item.grams}
                    disabled={!item.included}
                    onChange={(e) =>
                      setPhotoItems((current) =>
                        current.map((it, i) =>
                          i === index
                            ? { ...it, grams: Math.max(1, Number(e.target.value) || 1) }
                            : it,
                        ),
                      )
                    }
                  />
                  <span className="scanner-photo-items__unit">g</span>
                </li>
              ))}
            </ul>
            <div className="dialog__actions">
              <button
                type="button"
                className="button button--secondary"
                onClick={() => photoInputRef.current?.click()}
              >
                <Camera size={14} /> Anderes Foto
              </button>
              <button
                type="button"
                className="button button--primary"
                disabled={!photoItems.some((i) => i.included)}
                onClick={() => void runPhotoMatching()}
              >
                Weiter
              </button>
            </div>
          </div>
        )}

        {state.phase === "photo-review" && (
          <div className="scanner-result">
            <label>
              <span>Name</span>
              <input
                type="text"
                value={photoMealName}
                onChange={(e) => setPhotoMealName(e.target.value)}
              />
            </label>
            <ul className="scanner-photo-review__list">
              {photoMatches.map((m) => (
                <li key={m.item.id}>
                  <span>
                    {m.item.label} · {m.item.grams} g
                  </span>
                  {m.product ? (
                    <b>
                      {Math.round((m.product.caloriesPer100g * m.item.grams) / 100)} kcal
                    </b>
                  ) : (
                    <b className="scanner-photo-review__missing">nicht gefunden</b>
                  )}
                </li>
              ))}
            </ul>
            <div className="scanner-macros">
              <span>
                <Flame size={14} /> {matchedTotals.calories} kcal
              </span>
              <span>P {matchedTotals.proteinG} g</span>
              <span>K {matchedTotals.carbsG} g</span>
              <span>F {matchedTotals.fatG} g</span>
            </div>
            {photoMatches.some((m) => !m.product) && (
              <p className="dialog-hint">
                Für nicht gefundene Zutaten wurden keine Nährwerte gezählt —
                die kannst du separat manuell hinzufügen.
              </p>
            )}
            <div className="dialog__actions">
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setState({ phase: "photo-items" })}
              >
                Zurück
              </button>
              <button
                type="button"
                className="button button--primary"
                disabled={matchedTotals.calories === 0}
                onClick={() =>
                  onConfirm({
                    name: photoMealName || "Foto-Mahlzeit",
                    calories: matchedTotals.calories,
                    proteinG: matchedTotals.proteinG,
                    carbsG: matchedTotals.carbsG,
                    fatG: matchedTotals.fatG,
                    barcode: `photo-${photoMatches.map((m) => m.item.query).join("+")}`,
                    grams: matchedTotals.totalGrams,
                  })
                }
              >
                Als Mahlzeit hinzufügen
              </button>
            </div>
          </div>
        )}

        {state.phase === "found" && (
          <div className="scanner-result">
            <div className="scanner-result__head">
              {state.product.imageUrl && (
                <img src={state.product.imageUrl} alt="" />
              )}
              <div>
                <strong>{state.product.name}</strong>
                {state.product.brand && <small>{state.product.brand}</small>}
              </div>
            </div>
            <label>
              <span>Menge (g)</span>
              <input
                type="number"
                min={1}
                value={grams}
                onChange={(e) =>
                  setGrams(Math.max(1, Number(e.target.value) || 1))
                }
              />
            </label>
            <div className="scanner-macros">
              <span>
                <Flame size={14} /> {scale(state.product.caloriesPer100g)} kcal
              </span>
              <span>P {scale(state.product.proteinPer100g)} g</span>
              <span>K {scale(state.product.carbsPer100g)} g</span>
              <span>F {scale(state.product.fatPer100g)} g</span>
            </div>
            <div className="dialog__actions">
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setState({ phase: "scanning" })}
              >
                Erneut scannen
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={() => {
                  const product = state.product;
                  onConfirm({
                    name: product.name,
                    calories: scale(product.caloriesPer100g),
                    proteinG: scale(product.proteinPer100g),
                    carbsG: scale(product.carbsPer100g),
                    fatG: scale(product.fatPer100g),
                    barcode: product.barcode,
                    grams,
                    brand: product.brand,
                    imageUrl: product.imageUrl,
                  });
                }}
              >
                Als Mahlzeit hinzufügen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
