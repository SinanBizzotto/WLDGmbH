import * as Sentry from "@sentry/react";

let active = false;

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function redact(value: string): string {
  return value.replace(EMAIL_PATTERN, "[redacted-email]");
}

/**
 * No-ops until VITE_SENTRY_DSN is set (and always in demo mode, since the
 * safe-testing .env.local swap strips every var except the Supabase/demo
 * ones, so this is naturally disabled during local Playwright runs).
 */
export function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || active) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Errors here can carry raw Postgres/Postgrest messages (which may
    // echo back a user's email, e.g. from an auth error) — scrub before
    // it ever leaves the browser. sendDefaultPii stays off so the SDK
    // doesn't attach IP/cookie data on top of that.
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.message) event.message = redact(event.message);
      for (const exception of event.exception?.values ?? []) {
        if (exception.value) exception.value = redact(exception.value);
      }
      return event;
    },
  });
  active = true;
}

export function reportError(context: string, error: unknown) {
  if (import.meta.env.DEV) console.error(`[${context}]`, error);
  if (active) Sentry.captureException(error, { tags: { context } });
}

export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Wraps every function on an object so a thrown error is reported before
 * re-throwing (the caller's own try/catch still runs unchanged). Used for
 * FitnessContext's actions so a Supabase failure gets reported once,
 * centrally, no matter which action it came from.
 */
export function withReporting<T extends object>(value: T): T {
  const wrapped = {} as Record<string, unknown>;
  for (const [key, val] of Object.entries(value)) {
    if (typeof val === "function") {
      wrapped[key] = async (...args: unknown[]) => {
        try {
          return await (val as (...a: unknown[]) => unknown)(...args);
        } catch (error) {
          reportError(key, error);
          throw error;
        }
      };
    } else {
      wrapped[key] = val;
    }
  }
  return wrapped as T;
}
