import { createContext, useContext, useState, type ReactNode } from "react";
import { AlertCircle, Inbox } from "lucide-react";

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
