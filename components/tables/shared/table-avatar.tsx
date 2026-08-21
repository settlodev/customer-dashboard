"use client";

import { SafeImage } from "@/components/ui/safe-image";
import { isDisplayableImageUrl } from "@/lib/image-url";

const THUMB_PALETTE = [
  "#EB7F44",
  "#0E8B5F",
  "#C4892B",
  "#1F1F1F",
  "#C8442A",
  "#6B2D5C",
  "#0E7C7B",
  "#C25E26",
  "#1E3A8A",
  "#525252",
];

export function thumbColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return THUMB_PALETTE[hash % THUMB_PALETTE.length];
}

export function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return (
    parts
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "?"
  );
}

interface TableAvatarProps {
  name: string;
  imageUrl?: string | null;
  /** Stable identifier used to pick the initials background. Defaults to `name`. */
  seed?: string;
  /** Override the rendered initials (e.g. unit abbreviations). */
  overrideInitials?: string;
}

/**
 * Shared name-cell avatar for inventory tables. Mirrors the products list:
 * a 36px rounded thumb that shows the image when present, falling back to
 * deterministic-coloured initials with a subtle highlight gradient — both
 * when there is no image and when the stored URL fails to load.
 */
export function TableAvatar({
  name,
  imageUrl,
  seed,
  overrideInitials,
}: TableAvatarProps) {
  const initials = overrideInitials || initialsFor(name);
  const bg = thumbColor(seed ?? name);

  const initialsThumb = (
    <div
      className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg text-[14px] font-semibold tracking-tight text-white"
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      {initials}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.25), transparent 60%)",
        }}
      />
    </div>
  );

  if (isDisplayableImageUrl(imageUrl)) {
    return (
      <SafeImage
        src={imageUrl}
        alt={name}
        className="h-9 w-9 flex-shrink-0 rounded-lg object-cover"
        width={36}
        height={36}
        loading="lazy"
        fallback={initialsThumb}
      />
    );
  }

  return initialsThumb;
}
