"use client";

import { useId } from "react";
import {
  Facebook,
  ImageIcon,
  Instagram,
  Linkedin,
  MessageCircle,
  Music2,
  Palette,
  Search,
  Share2,
  Twitter,
  Type,
  Youtube,
} from "lucide-react";

import {
  ControlInput,
  ControlTextarea,
  FieldHint,
  StandaloneField as Field,
  controlBoxClass,
  controlInputClass,
  standaloneLabelClass,
} from "@/components/ui/field";
import { ImageDropzone } from "@/components/ui/image-dropzone";
import { cn } from "@/lib/utils";
import { isDisplayableImageUrl } from "@/lib/image-url";
import { SettingsSection } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import { PanelHeader } from "../shared/panel-header";
import { SettingsSaveBar } from "../shared/settings-save-bar";
import type { LocationSettings } from "@/types/location-settings/type";

const KEYS = [
  // Brand identity
  "primaryColor",
  "secondaryColor",
  "logoSquareUrl",
  "logoWideUrl",
  "faviconUrl",
  "bannerImageUrl",
  "fontFamily",
  "shareImageUrl",
  // Social media
  "facebookUrl",
  "instagramUrl",
  "twitterUrl",
  "tiktokUrl",
  "linkedinUrl",
  "youtubeUrl",
  "whatsappNumber",
  // SEO
  "seoTitle",
  "seoDescription",
] as const;

type ImageKey =
  | "logoSquareUrl"
  | "logoWideUrl"
  | "faviconUrl"
  | "bannerImageUrl"
  | "shareImageUrl";

const IMAGE_SLOTS: {
  key: ImageKey;
  label: string;
  hint: string;
  fit: "contain" | "cover";
}[] = [
  { key: "logoSquareUrl", label: "Square logo", hint: "1:1 — app icon, POS header, receipts.", fit: "contain" },
  { key: "logoWideUrl", label: "Wide logo", hint: "Horizontal lockup for page headers and invoices.", fit: "contain" },
  { key: "faviconUrl", label: "Favicon", hint: "PNG or SVG, 512×512 works best.", fit: "contain" },
  { key: "bannerImageUrl", label: "Banner image", hint: "Digital-menu hero, 3:1 landscape.", fit: "cover" },
  { key: "shareImageUrl", label: "Share image", hint: "Social previews and link cards, 1200×630.", fit: "cover" },
];

const SEO_TITLE_MAX = 200;
const SEO_DESC_MAX = 500;
const ICON = "h-3.5 w-3.5";

const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Black or white text for a given hex background, by relative luminance. */
function contrastText(hex: string): string {
  if (!HEX_RE.test(hex)) return "#ffffff";
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return lum > 0.45 ? "#111111" : "#ffffff";
}

export function BrandSocialPanel({
  settings,
  onSaved,
}: {
  settings: LocationSettings;
  onSaved: (next: LocationSettings) => void;
}) {
  const p = useSettingsPanel(KEYS, settings, onSaved);
  const v = p.values;
  const d = p.isPending;

  // Text fields send the raw string: "" is the explicit clear signal for the
  // PATCH-style settings endpoint (null/absent = unchanged).
  const text =
    (key: (typeof KEYS)[number]) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      p.setField(key, e.target.value);

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Brand & social"
        description="Colours, type, imagery, social links, and SEO shown on branded surfaces."
      />

      {/* 1 — Brand identity */}
      <SettingsSection
        icon={<Palette className="h-4 w-4" />}
        title="Brand identity"
        description="Colours, type, and imagery used on receipts, the digital menu, and other branded surfaces."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:col-span-2">
            <ColorField
              label="Primary colour"
              hint="Buttons, highlights and headers."
              value={v.primaryColor ?? ""}
              onChange={(c) => p.setField("primaryColor", c)}
              disabled={d}
            />
            <ColorField
              label="Secondary colour"
              hint="Accents, badges and secondary actions."
              value={v.secondaryColor ?? ""}
              onChange={(c) => p.setField("secondaryColor", c)}
              disabled={d}
            />
            <Field
              label="Font family"
              hint="CSS font stack, e.g. Inter, sans-serif."
              className="sm:col-span-2"
            >
              {(id) => (
                <ControlInput
                  id={id}
                  maxLength={100}
                  prefix={<Type className={ICON} />}
                  placeholder="Inter, sans-serif"
                  value={v.fontFamily ?? ""}
                  onChange={text("fontFamily")}
                  disabled={d}
                />
              )}
            </Field>
          </div>

          <div className="space-y-[7px] lg:col-span-1">
            <span className={standaloneLabelClass}>Preview</span>
            <BrandPreview
              primary={v.primaryColor ?? ""}
              secondary={v.secondaryColor ?? ""}
              font={v.fontFamily ?? ""}
              logo={v.logoSquareUrl ?? ""}
              title={v.seoTitle ?? ""}
            />
            <FieldHint>How the colours, type and square logo sit together.</FieldHint>
          </div>
        </div>

        <div className="space-y-3.5 border-t border-dashed border-line pt-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-3">
              Imagery
            </span>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
              PNG · JPG · WEBP · SVG · 5MB
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {IMAGE_SLOTS.map((slot) => (
              <Field key={slot.key} label={slot.label} hint={slot.hint} optional>
                {(id) => (
                  <ImageDropzone
                    id={id}
                    purpose="LOCATION_LOGO"
                    value={v[slot.key] ?? ""}
                    onChange={(url) => p.setField(slot.key, url ?? "")}
                    disabled={d}
                    fit={slot.fit}
                    maxSizeMb={5}
                    alt={slot.label}
                    ctaLabel={`Upload ${slot.label.toLowerCase()}`}
                    className="min-h-[164px]"
                  />
                )}
              </Field>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* 2 — Social media */}
      <SettingsSection
        icon={<Share2 className="h-4 w-4" />}
        title="Social media"
        description="Links and contact details for this location."
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Facebook">
            {(id) => (
              <ControlInput
                id={id}
                type="url"
                inputMode="url"
                maxLength={500}
                prefix={<Facebook className={ICON} />}
                placeholder="https://facebook.com/…"
                value={v.facebookUrl ?? ""}
                onChange={text("facebookUrl")}
                disabled={d}
              />
            )}
          </Field>
          <Field label="Instagram">
            {(id) => (
              <ControlInput
                id={id}
                type="url"
                inputMode="url"
                maxLength={500}
                prefix={<Instagram className={ICON} />}
                placeholder="https://instagram.com/…"
                value={v.instagramUrl ?? ""}
                onChange={text("instagramUrl")}
                disabled={d}
              />
            )}
          </Field>
          <Field label="X / Twitter">
            {(id) => (
              <ControlInput
                id={id}
                type="url"
                inputMode="url"
                maxLength={500}
                prefix={<Twitter className={ICON} />}
                placeholder="https://x.com/…"
                value={v.twitterUrl ?? ""}
                onChange={text("twitterUrl")}
                disabled={d}
              />
            )}
          </Field>
          <Field label="TikTok">
            {(id) => (
              <ControlInput
                id={id}
                type="url"
                inputMode="url"
                maxLength={500}
                prefix={<Music2 className={ICON} />}
                placeholder="https://tiktok.com/@…"
                value={v.tiktokUrl ?? ""}
                onChange={text("tiktokUrl")}
                disabled={d}
              />
            )}
          </Field>
          <Field label="LinkedIn">
            {(id) => (
              <ControlInput
                id={id}
                type="url"
                inputMode="url"
                maxLength={500}
                prefix={<Linkedin className={ICON} />}
                placeholder="https://linkedin.com/company/…"
                value={v.linkedinUrl ?? ""}
                onChange={text("linkedinUrl")}
                disabled={d}
              />
            )}
          </Field>
          <Field label="YouTube">
            {(id) => (
              <ControlInput
                id={id}
                type="url"
                inputMode="url"
                maxLength={500}
                prefix={<Youtube className={ICON} />}
                placeholder="https://youtube.com/@…"
                value={v.youtubeUrl ?? ""}
                onChange={text("youtubeUrl")}
                disabled={d}
              />
            )}
          </Field>
          <Field label="WhatsApp number" hint="Customers reach this number from the digital menu.">
            {(id) => (
              <ControlInput
                id={id}
                type="tel"
                inputMode="tel"
                maxLength={20}
                prefix={<MessageCircle className={ICON} />}
                placeholder="+255 712 345 678"
                value={v.whatsappNumber ?? ""}
                onChange={text("whatsappNumber")}
                disabled={d}
              />
            )}
          </Field>
        </div>
      </SettingsSection>

      {/* 3 — SEO */}
      <SettingsSection
        icon={<Search className="h-4 w-4" />}
        title="SEO"
        description="Page title and description used by search engines and social previews."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-3.5 lg:col-span-2">
            <Field
              label="SEO title"
              hint={
                <CharCount
                  length={(v.seoTitle ?? "").length}
                  max={SEO_TITLE_MAX}
                  ideal="50–60 characters is ideal"
                />
              }
            >
              {(id) => (
                <ControlInput
                  id={id}
                  maxLength={SEO_TITLE_MAX}
                  placeholder="e.g. Pizza Inn Masaki — wood-fired pizza in Dar"
                  value={v.seoTitle ?? ""}
                  onChange={text("seoTitle")}
                  disabled={d}
                />
              )}
            </Field>
            <Field
              label="SEO description"
              hint={
                <CharCount
                  length={(v.seoDescription ?? "").length}
                  max={SEO_DESC_MAX}
                  ideal="150–160 characters is ideal"
                />
              }
            >
              {(id) => (
                <ControlTextarea
                  id={id}
                  rows={4}
                  maxLength={SEO_DESC_MAX}
                  placeholder="One or two sentences on what customers find here."
                  value={v.seoDescription ?? ""}
                  onChange={text("seoDescription")}
                  disabled={d}
                />
              )}
            </Field>
          </div>
          <div className="space-y-[7px] lg:col-span-1">
            <span className={standaloneLabelClass}>Search preview</span>
            <SearchPreview
              title={v.seoTitle ?? ""}
              description={v.seoDescription ?? ""}
              favicon={v.faviconUrl ?? v.logoSquareUrl ?? ""}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSaveBar
        dirtyCount={p.dirtyCount}
        isPending={p.isPending}
        onSave={p.save}
        onDiscard={() => p.reset()}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Local primitives
// ──────────────────────────────────────────────────────────────────────

function ColorField({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const valid = HEX_RE.test(value);
  return (
    <div className="min-w-0 space-y-[7px]">
      <label htmlFor={id} className={standaloneLabelClass}>
        {label}
      </label>
      <div
        data-disabled={disabled ? "" : undefined}
        className={cn(controlBoxClass, "pr-0")}
      >
        <label
          className={cn(
            "relative grid h-6 w-6 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-md border border-line",
            !valid && "bg-[repeating-conic-gradient(hsl(var(--line))_0_25%,transparent_0_50%)] bg-[length:8px_8px]",
          )}
          style={valid ? { backgroundColor: value } : undefined}
          title="Pick a colour"
        >
          <input
            type="color"
            aria-label={`${label} picker`}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            value={valid && value.length === 7 ? value.toLowerCase() : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        </label>
        <input
          id={id}
          className={cn(controlInputClass, "font-mono uppercase")}
          maxLength={20}
          spellCheck={false}
          placeholder="#1E90FF"
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          disabled={disabled}
        />
        <span className="grid shrink-0 self-stretch place-items-center border-l border-line px-[13px] font-mono text-[11px] font-semibold text-muted-foreground">
          HEX
        </span>
      </div>
      {hint && <FieldHint>{hint}</FieldHint>}
    </div>
  );
}

function BrandPreview({
  primary,
  secondary,
  font,
  logo,
  title,
}: {
  primary: string;
  secondary: string;
  font: string;
  logo: string;
  title: string;
}) {
  const p = HEX_RE.test(primary) ? primary : "#1f2937";
  const s = HEX_RE.test(secondary) ? secondary : "#e5e7eb";
  const fontFamily = font.trim() || undefined;
  const name = title.trim() || "Your business";
  return (
    <div className="overflow-hidden rounded-[10px] border border-line bg-card">
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: p, color: contrastText(p), fontFamily }}
      >
        {/* White-alpha here is deliberate: this strip is filled with the
            merchant's own primary colour, so the logo plate and the initial
            fallback sit on it rather than on a theme surface. */}
        {isDisplayableImageUrl(logo) ? (
          // eslint-disable-next-line @next/next/no-img-element -- upload host isn't in next/image remotePatterns
          <img
            src={logo}
            alt=""
            className="h-8 w-8 shrink-0 rounded-md bg-white/90 object-contain p-0.5"
          />
        ) : (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/20 text-[11px] font-bold">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="truncate text-sm font-semibold">{name}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3" style={{ fontFamily }}>
        <span
          className="rounded-md px-3 py-1.5 text-xs font-medium"
          style={{ backgroundColor: p, color: contrastText(p) }}
        >
          Order now
        </span>
        <span
          className="rounded-md px-3 py-1.5 text-xs font-medium"
          style={{ backgroundColor: s, color: contrastText(s) }}
        >
          View menu
        </span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          {fontFamily ? font.split(",")[0].trim() : "System font"}
        </span>
      </div>
    </div>
  );
}

function SearchPreview({
  title,
  description,
  favicon,
}: {
  title: string;
  description: string;
  favicon: string;
}) {
  const t = title.trim() || "Your location's page title";
  const desc =
    description.trim() ||
    "Your SEO description appears here — a short pitch that makes people click.";
  return (
    <div className="rounded-[10px] border border-line bg-card p-4">
      <div className="flex items-center gap-2">
        {isDisplayableImageUrl(favicon) ? (
          // eslint-disable-next-line @next/next/no-img-element -- upload host isn't in next/image remotePatterns
          <img src={favicon} alt="" className="h-6 w-6 rounded-full border border-line bg-canvas object-contain" />
        ) : (
          <span className="grid h-6 w-6 place-items-center rounded-full border border-line bg-canvas">
            <Search className="h-3 w-3 text-muted-foreground" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[12px] text-ink-2">settlo.co.tz</p>
          <p className="truncate font-mono text-[10px] text-muted-foreground">https://menu.settlo.co.tz › …</p>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-[15px] leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">
        {t}
      </p>
      <p className="mt-1 line-clamp-3 text-[12.5px] leading-snug text-ink-2">{desc}</p>
    </div>
  );
}

function CharCount({
  length,
  max,
  ideal,
}: {
  length: number;
  max: number;
  ideal: string;
}) {
  const near = length > max * 0.9;
  return (
    <span className="flex flex-wrap items-center justify-between gap-x-3">
      <span>{ideal}.</span>
      <span
        className={cn(
          "font-mono tabular-nums",
          near ? "text-warn" : "text-muted-foreground",
        )}
      >
        {length}/{max}
      </span>
    </span>
  );
}
