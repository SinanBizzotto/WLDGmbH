import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { AlertCircle, Flame, ScanLine, X } from "lucide-react";
import { lookupProductByBarcode, type ScannedProduct } from "../lib/openFoodFacts";

type ScanState =
  | { phase: "scanning" }
  | { phase: "looking-up"; barcode: string }
  | { phase: "found"; product: ScannedProduct }
  | { phase: "not-found"; barcode: string }
  | { phase: "camera-error"; message: string };

export interface ScannedMeal {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface BarcodeScannerProps {
  onClose: () => void;
  onConfirm: (meal: ScannedMeal) => void;
}

const HINTS = new Map();
HINTS.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
]);

export default function BarcodeScanner({
  onClose,
  onConfirm,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [state, setState] = useState<ScanState>({ phase: "scanning" });
  const [grams, setGrams] = useState(100);

  useEffect(() => {
    if (state.phase !== "scanning") return;
    let cancelled = false;
    const reader = new BrowserMultiFormatReader(HINTS);

    reader
      .decodeFromVideoDevice(
        undefined,
        videoRef.current ?? undefined,
        (result, _error, controls) => {
          controlsRef.current = controls;
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

  return (
    <div
      className="modal"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="dialog scanner-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scanner-title"
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
            <p className="dialog-hint">
              Halte den Barcode der Verpackung vor die Kamera.
            </p>
          </div>
        )}

        {state.phase === "looking-up" && (
          <div className="scanner-status">
            <ScanLine className="scanner-status__icon scanner-status__icon--spin" />
            <p>Produkt wird gesucht…</p>
          </div>
        )}

        {state.phase === "camera-error" && (
          <div className="scanner-status">
            <AlertCircle className="scanner-status__icon" />
            <p>{state.message}</p>
          </div>
        )}

        {state.phase === "not-found" && (
          <div className="scanner-status">
            <AlertCircle className="scanner-status__icon" />
            <p>
              Kein Produkt zu diesem Barcode gefunden ({state.barcode}). Du
              kannst die Mahlzeit stattdessen manuell hinzufügen.
            </p>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setState({ phase: "scanning" })}
            >
              Erneut scannen
            </button>
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
