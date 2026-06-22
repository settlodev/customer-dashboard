// Shared helpers for resilient server-side list fetches.
//
// Throwing out of a Server Component trips the route's error.tsx and replaces
// the whole page. For a list page a transient backend failure (gateway 502,
// timeout, …) should instead degrade only the data area — see
// components/layouts/data-load-error — keeping the page chrome and offering a
// retry. softFetch() yields null on such failures so the page can render that
// fallback, while auth/permission errors are re-thrown so (protected)/error.tsx
// can route them to the session-expired / permission-denied screens.

/** Codes the (protected)/error.tsx boundary handles with dedicated screens. */
export const BOUNDARY_ERROR_CODES = [
  "SESSION_EXPIRED",
  "UNAUTHORIZED",
  "REFRESH_TOKEN_INVALID",
  "REFRESH_TOKEN_EXPIRED",
  "FORBIDDEN",
] as const;

/**
 * True when an error must bubble to the route error boundary rather than be
 * swallowed into an in-page fallback (auth/permission). The digest is the only
 * signal that survives the RSC boundary — SettloApiError sets it to err.code.
 */
export function isBoundaryError(error: unknown): boolean {
  const e = error as { digest?: string; code?: string } | null;
  const code = e?.digest ?? e?.code;
  return (
    typeof code === "string" &&
    (BOUNDARY_ERROR_CODES as readonly string[]).includes(code)
  );
}

/**
 * Await a server-side list fetch, returning null for transient / unexpected
 * failures (so the page can render an in-page retry) while re-throwing
 * auth/permission errors for the route error boundary.
 *
 * Usage:
 *   const data = await softFetch(searchThings(q, page));
 *   if (!data) return <DataLoadError itemName="things" />;  // inside the shell
 */
export async function softFetch<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    if (isBoundaryError(error)) throw error;
    return null;
  }
}
