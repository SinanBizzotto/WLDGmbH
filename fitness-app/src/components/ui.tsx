import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, Inbox } from "lucide-react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Focus trap + Escape-to-close + focus restoration for a modal dialog.
 * Attach the returned ref to the dialog's outer content element (not the
 * full-screen backdrop). Re-queries focusable elements on every Tab press
 * so it stays correct even as a dialog's content changes between phases.
 */
export function useModalA11y<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
) {
  const containerRef = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    const focusable = container?.querySelectorAll<HTMLElement>(
      FOCUSABLE_SELECTOR,
    );
    (focusable?.[0] ?? container)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !container) return;
      const items = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);
  return containerRef;
}

type ToastKind = "success" | "error";
interface Toast {
  message: string;
  kind: ToastKind;
}
const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(
  () => undefined,
);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const show = (message: string, kind: ToastKind = "success") => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 2800);
  };
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div className={`toast toast--${toast.kind}`} role="status">
          {toast.kind === "error" && <AlertCircle size={17} />} {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  danger = false,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  const dialogRef = useModalA11y<HTMLDivElement>(open, onCancel);
  if (!open) return null;
  return (
    <div
      className="modal"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <h2 id="dialog-title">{title}</h2>
        <p>{message}</p>
        <div className="dialog__actions">
          <button className="button button--secondary" onClick={onCancel}>
            Abbrechen
          </button>
          <button
            className={`button ${danger ? "button--danger" : "button--primary"}`}
            onClick={onConfirm}
          >
            Bestätigen
          </button>
        </div>
      </div>
    </div>
  );
}
export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Inbox />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function LoadingSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="skeleton-grid" aria-label="Inhalte werden geladen">
      {Array.from({ length: cards }, (_, i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}
export function PageError({ retry }: { retry: () => void }) {
  return (
    <div className="empty-state">
      <AlertCircle />
      <h3>Daten konnten nicht geladen werden</h3>
      <p>Prüfe deine Verbindung und versuche es erneut.</p>
      <button className="button button--primary" onClick={retry}>
        Erneut versuchen
      </button>
    </div>
  );
}
