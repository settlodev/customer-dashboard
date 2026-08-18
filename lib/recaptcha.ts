/**
 * Client-side helper for Google reCAPTCHA Enterprise.
 *
 * Loads the Enterprise script imperatively the first time it's needed and
 * exchanges `grecaptcha.enterprise.execute()` tokens for a backend assessment.
 * Bypasses Next.js's <Script> component so the loader is robust against
 * App Router quirks (head injection, layout segments, etc.).
 *
 * Loading happens in two hops, which is what the waiting logic below is shaped
 * around:
 *   1. `enterprise.js` — a ~1KB bootstrap. It synchronously defines
 *      `grecaptcha.enterprise.ready()` (a callback queue) and injects hop 2.
 *   2. `https://www.gstatic.com/recaptcha/releases/<hash>/recaptcha__en.js` —
 *      the real API, several hundred KB, SRI-pinned. It attaches
 *      `execute()` and drains the `ready()` queue.
 *
 * So `script.onload` firing only means hop 1 arrived. `execute` can still be
 * many seconds away on a slow connection — Google's own budget for it is
 * 20-30s. Waiting on `ready()` instead of polling for `execute` is what makes
 * this reliable.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const SCRIPT_ID = "recaptcha-enterprise-script";

// Hop 1 defines `ready` synchronously, so this only expires when the script
// was blocked (extension / filtering proxy serving an empty 200) or never ran.
const BOOTSTRAP_TIMEOUT_MS = 3_000;
// Hop 2 is the big one. Google's own bootstrap sets anchor-ms=20000 and
// execute-ms=30000; anything much shorter fails legitimate slow connections.
const READY_TIMEOUT_MS = 20_000;

let scriptLoadPromise: Promise<void> | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The global as it actually exists mid-load: methods land one at a time. */
type PartialEnterprise = Partial<GrecaptchaEnterprise>;

function currentEnterprise(): PartialEnterprise | undefined {
  return typeof window === "undefined"
    ? undefined
    : (window.grecaptcha?.enterprise as PartialEnterprise | undefined);
}

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

    // Already injected (HMR re-running this module, or a retry after a
    // readiness timeout). We can't tell whether its load event has already
    // fired, and a listener added afterwards would never run — so resolve and
    // let waitForEnterprise() decide, since it polls the global directly.
    if (document.getElementById(SCRIPT_ID)) {
      resolve();
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
      script.remove();
      reject(new Error("reCAPTCHA script failed to load"));
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * Resolve once `grecaptcha.enterprise.execute` is actually callable.
 *
 * Distinguishes the two failure modes so the console says which one happened:
 * the bootstrap never ran (blocked), vs. the bootstrap ran but the gstatic
 * payload never arrived (slow link, blocked CDN, SRI mismatch from a proxy).
 */
async function waitForEnterprise(
  timeoutMs = READY_TIMEOUT_MS,
): Promise<GrecaptchaEnterprise> {
  // Phase 1 — wait for the bootstrap to define `ready()`.
  const bootstrapDeadline = Date.now() + BOOTSTRAP_TIMEOUT_MS;
  while (!currentEnterprise()?.ready) {
    if (Date.now() > bootstrapDeadline) {
      throw new Error(
        "reCAPTCHA bootstrap ran but never defined grecaptcha.enterprise — " +
          "the script is most likely blocked by an ad blocker, browser extension, " +
          "or network filter",
      );
    }
    await sleep(50);
  }

  const bootstrapped = currentEnterprise()!;
  if (bootstrapped.execute) return bootstrapped as GrecaptchaEnterprise;

  // Phase 2 — ready() fires when recaptcha__en.js has attached execute().
  let timer: ReturnType<typeof setTimeout>;
  await Promise.race([
    new Promise<void>((resolve) => bootstrapped.ready!(() => resolve())),
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new Error(
              `reCAPTCHA did not finish initialising within ${timeoutMs}ms — ` +
                "www.gstatic.com is slow or unreachable",
            ),
          ),
        timeoutMs,
      );
    }),
  ]).finally(() => clearTimeout(timer));

  const ready = currentEnterprise();
  if (!ready?.execute) {
    throw new Error("reCAPTCHA reported ready but execute() is missing");
  }
  return ready as GrecaptchaEnterprise;
}

/**
 * Start loading reCAPTCHA ahead of time.
 *
 * Call this when a form that will need a token mounts. Without it the entire
 * two-hop download happens inside the submit handler, which is what pushes
 * slow connections past the timeout.
 *
 * Never rejects — failures surface at executeRecaptcha() time.
 */
export function preloadRecaptcha(): void {
  if (!SITE_KEY || typeof window === "undefined") return;
  loadRecaptchaScript(SITE_KEY).catch(() => {
    /* reported by executeRecaptcha() on submit */
  });
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

  let enterprise: GrecaptchaEnterprise;
  try {
    enterprise = await waitForEnterprise();
  } catch (err) {
    // Drop the cached promise so a retry re-checks (and re-injects if the tag
    // went away) instead of replaying the same dead state.
    scriptLoadPromise = null;
    throw err;
  }

  return enterprise.execute(SITE_KEY, { action });
}
