"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SettingsSection } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import { PanelHeader } from "../shared/panel-header";
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

export function BrandSocialPanel({
  settings,
  onSaved,
}: {
  settings: LocationSettings;
  onSaved: (next: LocationSettings) => void;
}) {
  const p = useSettingsPanel(KEYS, settings, onSaved);
  const v = p.values;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Brand & social"
        description="Colours, type, imagery, social links, and SEO shown on branded surfaces."
      />

      <SettingsSection
        title="Brand identity"
        description="Colours, type, and imagery used on receipts, the digital menu, and other branded surfaces."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Primary color" hint="Hex value e.g. #1e90ff">
            <div className="flex items-center gap-2">
              <Input
                type="color"
                className="h-10 w-12 p-1"
                value={v.primaryColor || "#000000"}
                onChange={(e) => p.setField("primaryColor", e.target.value)}
                disabled={p.isPending}
              />
              <Input
                maxLength={20}
                value={v.primaryColor ?? ""}
                onChange={(e) => p.setField("primaryColor", e.target.value)}
                disabled={p.isPending}
              />
            </div>
          </Field>
          <Field label="Secondary color">
            <div className="flex items-center gap-2">
              <Input
                type="color"
                className="h-10 w-12 p-1"
                value={v.secondaryColor || "#000000"}
                onChange={(e) => p.setField("secondaryColor", e.target.value)}
                disabled={p.isPending}
              />
              <Input
                maxLength={20}
                value={v.secondaryColor ?? ""}
                onChange={(e) => p.setField("secondaryColor", e.target.value)}
                disabled={p.isPending}
              />
            </div>
          </Field>
          <Field label="Font family">
            <Input
              maxLength={100}
              placeholder="Inter, sans-serif"
              value={v.fontFamily ?? ""}
              onChange={(e) => p.setField("fontFamily", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
          <Field label="Square logo URL">
            <Input
              maxLength={500}
              value={v.logoSquareUrl ?? ""}
              onChange={(e) => p.setField("logoSquareUrl", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
          <Field label="Wide logo URL">
            <Input
              maxLength={500}
              value={v.logoWideUrl ?? ""}
              onChange={(e) => p.setField("logoWideUrl", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
          <Field label="Favicon URL">
            <Input
              maxLength={500}
              value={v.faviconUrl ?? ""}
              onChange={(e) => p.setField("faviconUrl", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
          <Field label="Banner image URL">
            <Input
              maxLength={500}
              value={v.bannerImageUrl ?? ""}
              onChange={(e) => p.setField("bannerImageUrl", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
          <Field label="Share image URL" hint="Used for social previews and link cards.">
            <Input
              maxLength={500}
              value={v.shareImageUrl ?? ""}
              onChange={(e) => p.setField("shareImageUrl", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Social media"
        description="Links and contact details for this location."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Facebook URL">
            <Input
              maxLength={500}
              placeholder="https://facebook.com/…"
              value={v.facebookUrl ?? ""}
              onChange={(e) => p.setField("facebookUrl", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
          <Field label="Instagram URL">
            <Input
              maxLength={500}
              placeholder="https://instagram.com/…"
              value={v.instagramUrl ?? ""}
              onChange={(e) => p.setField("instagramUrl", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
          <Field label="Twitter / X URL">
            <Input
              maxLength={500}
              value={v.twitterUrl ?? ""}
              onChange={(e) => p.setField("twitterUrl", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
          <Field label="TikTok URL">
            <Input
              maxLength={500}
              value={v.tiktokUrl ?? ""}
              onChange={(e) => p.setField("tiktokUrl", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
          <Field label="LinkedIn URL">
            <Input
              maxLength={500}
              value={v.linkedinUrl ?? ""}
              onChange={(e) => p.setField("linkedinUrl", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
          <Field label="YouTube URL">
            <Input
              maxLength={500}
              value={v.youtubeUrl ?? ""}
              onChange={(e) => p.setField("youtubeUrl", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
          <Field label="WhatsApp number">
            <Input
              maxLength={20}
              placeholder="+255712345678"
              value={v.whatsappNumber ?? ""}
              onChange={(e) => p.setField("whatsappNumber", e.target.value)}
              disabled={p.isPending}
            />
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        title="SEO"
        description="Page-title and description used by search engines and social previews."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <Field label="SEO title">
          <Input
            maxLength={200}
            value={v.seoTitle ?? ""}
            onChange={(e) => p.setField("seoTitle", e.target.value)}
            disabled={p.isPending}
          />
        </Field>
        <Field label="SEO description">
          <Textarea
            rows={3}
            maxLength={500}
            value={v.seoDescription ?? ""}
            onChange={(e) => p.setField("seoDescription", e.target.value)}
            disabled={p.isPending}
          />
        </Field>
      </SettingsSection>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
