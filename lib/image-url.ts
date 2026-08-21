/**
 * Hosts that used to serve uploads and no longer resolve.
 *
 * Entities carried over in the old-database migration still hold
 * `https://app.tality.co.tz/uploads/<hash>.jpg` URLs. That DNS zone is gone
 * (NXDOMAIN at the apex) and the files were never copied into the R2 bucket
 * the current presigned-upload flow writes to, so every one of those URLs is a
 * guaranteed miss: a direct `<img>` fails as ERR_NAME_NOT_RESOLVED, and
 * `next/image` turns it into a 502 from the optimizer after a server-side
 * fetch. Treating them as "no image" up front keeps the placeholder instant
 * and spares a doomed round-trip per thumbnail.
 *
 * Drop a host from this set if its files are ever restored.
 */
const RETIRED_UPLOAD_HOSTS = new Set(["app.tality.co.tz", "app.tallity.co.tz"]);

export function isRetiredImageUrl(url?: string | null): boolean {
  if (!url || !url.startsWith("http")) return false;
  try {
    return RETIRED_UPLOAD_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * True when `url` is worth handing to an `<img>` / `next/image` src: an
 * absolute or root-relative URL that isn't parked on a retired host.
 */
export function isDisplayableImageUrl(url?: string | null): url is string {
  return (
    !!url &&
    (url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("/")) &&
    !isRetiredImageUrl(url)
  );
}
