"use client";

import Image from "next/image";

import { useImageFallback } from "@/components/ui/safe-image";
import { isDisplayableImageUrl } from "@/lib/image-url";

interface DocumentLogoProps {
  src?: string | null;
  alt: string;
  /**
   * Rendered height in px. Every logo is normalised to this, whatever shape
   * it was uploaded in — see the note on consistency below.
   */
  heightPx?: number;
  /** Ceiling on width, so a very wide banner can't crowd out the title. */
  maxWidthPx?: number;
}

/**
 * The letterhead logo on a business document — and nothing at all when there
 * isn't one to show.
 *
 * ## Consistent sizing
 *
 * Logos arrive in wildly different shapes: a square app icon, a wide wordmark,
 * an occasional tall crest. Fitting them all into one square box (what this
 * did before) keeps the aspect ratio but destroys the visual consistency —
 * a 4:1 wordmark fitted into 64×64 renders 16px tall and looks broken next to
 * a square logo filling the whole box.
 *
 * So the box is normalised on HEIGHT instead, which is what the eye reads as
 * "how big is this logo", and width is left free up to a cap. Every letterhead
 * now has a logo of the same visual weight: the wordmark runs the full height
 * and extends sideways, the square one is the same height and narrow.
 *
 * The image itself is still `object-contain` — deliberately not stretched.
 * Distorting a business's own logo on the invoices it sends to its customers
 * is not a trade worth making for another few pixels of uniformity.
 *
 * ## Robustness
 *
 * A printed document is filed and sent on, so a broken-image glyph or an
 * empty reserved box at the top of it is worse than no logo: this renders
 * `null` (no wrapper, no gap) when the URL is missing, sits on a retired
 * upload host, or fails to load for any reason — a 404, a DNS miss, a
 * revoked object, a bucket that moved.
 *
 * Deliberately `unoptimized`: tenant logos live on whatever host the business
 * uploaded to, and the default loader THROWS on a hostname that isn't in
 * `next.config` `images.remotePatterns` — which would take the whole document
 * down rather than just drop the logo. Skipping the optimizer trades a few KB
 * on a once-printed page for a document that always renders.
 */
export function DocumentLogo({
  src,
  alt,
  heightPx = 56,
  maxWidthPx = 200,
}: DocumentLogoProps) {
  const { failed, onError } = useImageFallback(src);

  if (failed || !isDisplayableImageUrl(src)) return null;

  return (
    <Image
      src={src}
      alt={alt}
      // next/image needs intrinsic numbers; the style below is what actually
      // sizes it, and `w-auto` keeps the aspect ratio honest.
      width={maxWidthPx}
      height={heightPx}
      unoptimized
      onError={onError}
      className="h-auto w-auto shrink-0 object-contain object-left"
      style={{ height: heightPx, maxWidth: maxWidthPx, width: "auto" }}
    />
  );
}
