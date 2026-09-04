"use client";

import Image from "next/image";

import { useImageFallback } from "@/components/ui/safe-image";
import { isDisplayableImageUrl } from "@/lib/image-url";

interface DocumentLogoProps {
  src?: string | null;
  alt: string;
  /** Square box the logo is fitted into. */
  sizePx?: number;
}

/**
 * The letterhead logo on a business document — and nothing at all when there
 * isn't one to show.
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
export function DocumentLogo({ src, alt, sizePx = 64 }: DocumentLogoProps) {
  const { failed, onError } = useImageFallback(src);

  if (failed || !isDisplayableImageUrl(src)) return null;

  return (
    <div
      className="relative shrink-0"
      style={{ height: sizePx, width: sizePx }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${sizePx}px`}
        unoptimized
        onError={onError}
        className="object-contain"
      />
    </div>
  );
}
