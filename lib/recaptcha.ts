/**
 * Client-side helper for Google reCAPTCHA Enterprise.
 *
 * Loads the Enterprise script imperatively the first time it's needed and
 * exchanges `grecaptcha.enterprise.execute()` tokens for a backend assessment.
 * Bypasses Next.js's <Script> component so the loader is robust against
 * App Router quirks (head injection, layout segments, etc.).
 */

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const SCRIPT_ID = "recaptcha-enterprise-script";

let scriptLoadPromise: Promise<void> | null = null;

/**
 * Inject the reCAPTCHA Enterprise script into <head> exactly once.
 * Subsequent calls return the same promise.
 */
function loadRecaptchaScript(siteKey: string): Promise<void> {
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("reCAPTCHA must be loaded in the browser"));
      return;
    }

    // Already injected (e.g. HMR re-running this module) — wait for it.
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.grecaptcha?.enterprise) {
        resolve();
      } else {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error("reCAPTCHA script failed to load")),
        );
      }
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (event) => {
      console.error("[reCAPTCHA] Script tag failed to load — adblocker or CSP?", event);
      // Reset so the next call retries (not cached as a failed promise).
      scriptLoadPromise = null;
      reject(new Error("reCAPTCHA script failed to load"));
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

// Wait for `grecaptcha.enterprise` to be ready after the script onload fires.
// onload signals the bytes arrived; the global is attached a tick later.
async function waitForEnterprise(timeoutMs = 5000): Promise<GrecaptchaEnterprise> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const enterprise = window.grecaptcha?.enterprise;
    if (enterprise?.execute) return enterprise;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("reCAPTCHA loaded but grecaptcha.enterprise never appeared");
}

/**
 * Execute reCAPTCHA Enterprise for a given action and return a token.
 * Pass the token to the backend; the backend assesses it and decides
 * whether to allow the request.
 *
 * Returns `undefined` when NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set —
 * this keeps dev/test environments usable without a provisioned key.
 *
 * @param action — short label used by Google to score the action
 *                 (e.g. "login", "register"). Must match what the backend
 *                 expects, or the assessment is treated as suspicious.
 */
export async function executeRecaptcha(action: string): Promise<string | undefined> {
  if (!SITE_KEY) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[reCAPTCHA] NEXT_PUBLIC_RECAPTCHA_SITE_KEY not set — skipping verification",
      );
    }
    return undefined;
  }

  await loadRecaptchaScript(SITE_KEY);
  const enterprise = await waitForEnterprise();

  return new Promise<string>((resolve, reject) => {
    enterprise.ready(() => {
      enterprise
        .execute(SITE_KEY, { action })
        .then(resolve)
        .catch((err: unknown) =>
          reject(err instanceof Error ? err : new Error(String(err))),
        );
    });
  });
}
