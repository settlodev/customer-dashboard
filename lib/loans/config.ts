/**
 * Feature toggle for the Loans / Financing module.
 *
 * The whole module (sidebar entry + `/loans*` routes) is gated on this flag so
 * it can ship dark and be switched on per-environment when the team is ready.
 *
 * Enable by setting, in the environment (e.g. `.env.local` or Vercel):
 *
 *     NEXT_PUBLIC_LOANS_ENABLED=true
 *
 * It is `NEXT_PUBLIC_` so the same value is readable by the client-rendered
 * sidebar and by the server components that guard the routes. Defaults to
 * OFF — anything other than a truthy token keeps the module hidden.
 */
export const LOANS_ENABLED = /^(1|true|yes|on)$/i.test(
  process.env.NEXT_PUBLIC_LOANS_ENABLED ?? "",
);
