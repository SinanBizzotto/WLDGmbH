import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { initMonitoring, SentryErrorBoundary } from "./lib/monitoring";
import "./styles.css";

initMonitoring();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SentryErrorBoundary
      fallback={
        <div className="empty-state">
          <h3>Etwas ist schiefgelaufen</h3>
          <p>Bitte lade die Seite neu.</p>
          <button
            className="button button--primary"
            onClick={() => location.reload()}
          >
            Neu laden
          </button>
        </div>
      }
    >
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </SentryErrorBoundary>
  </StrictMode>,
);
