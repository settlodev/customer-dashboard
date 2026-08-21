"use client";

import Image, { type ImageProps } from "next/image";
import { useState, type ReactNode } from "react";

import { isRetiredImageUrl } from "@/lib/image-url";

/**
 * Tracks whether `src` failed to load, so a caller can swap in its own
 * placeholder instead of painting a broken thumb.
 *
 * URLs on a known-retired host never even get attempted (see
 * {@link isRetiredImageUrl}); everything else is optimistic until the browser
 * says otherwise.
 *
 * The failure is keyed on the URL rather than a boolean so a recycled row
 * that lands on a different image retries on its own — no reset effect.
 */
export function useImageFallback(src?: string | null) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return {
    failed: !src || isRetiredImageUrl(src) || failedSrc === src,
    onError: () => setFailedSrc(src ?? null),
  };
}

type SafeImageProps = Omit<ImageProps, "src" | "onError"> & {
  src: string;
  /** Rendered in place of the image when the source can't be loaded. */
  fallback: ReactNode;
};

/** `next/image` that degrades to `fallback` when the source fails to load. */
export function SafeImage({ src, fallback, ...props }: SafeImageProps) {
  const { failed, onError } = useImageFallback(src);
  if (failed) return <>{fallback}</>;
  // eslint-disable-next-line jsx-a11y/alt-text -- ImageProps requires `alt`; it arrives through {...props}
  return <Image src={src} onError={onError} {...props} />;
}
