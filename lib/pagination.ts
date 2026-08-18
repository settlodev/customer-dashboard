/**
 * App-wide default rows-per-page — the single source of truth for server-paged
 * lists. A page derives its fetch `size` from this, and the shared DataTable's
 * rows-per-page control falls back to it when the URL carries no `?limit`, so
 * the label can never drift from the number of rows actually loaded.
 *
 * This lives in a plain (non-"use client") module on purpose: Server Components
 * import the value directly, and importing it from the client `data-table`
 * module would hand the server a client-reference proxy instead of the number —
 * which then gets stringified into `?size=[object Object]` and rejected by the
 * backend ("Parameter 'size' must be of type int").
 */
export const DEFAULT_PAGE_SIZE = 10;
