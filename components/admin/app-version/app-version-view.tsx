"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  deleteAppVersionGate,
  upsertAppVersionGate,
} from "@/lib/actions/admin/app-version";
import type { AppVersionGateRow } from "@/types/admin/app-version";

const APP_TYPE = "SETTLO_PRO_V3";
const PLATFORMS = ["ANDROID", "IOS"] as const;
type Platform = (typeof PLATFORMS)[number];

interface AppVersionViewProps {
  rows: AppVersionGateRow[];
}

interface Draft {
  minVersionCode: string;
  latestVersionCode: string;
  latestVersionName: string;
  updateUrl: string;
  message: string;
}

function findRow(
  rows: AppVersionGateRow[],
  platform: Platform,
): AppVersionGateRow | undefined {
  return rows.find((r) => r.appType === APP_TYPE && r.platform === platform);
}

const draftFrom = (row: AppVersionGateRow | undefined): Draft => ({
  minVersionCode: row ? String(row.minVersionCode) : "",
  latestVersionCode: row ? String(row.latestVersionCode) : "",
  latestVersionName: row?.latestVersionName ?? "",
  updateUrl: row?.updateUrl ?? "",
  message: row?.message ?? "",
});

export function AppVersionView({ rows }: AppVersionViewProps) {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform>("ANDROID");
  const existing = findRow(rows, platform);
  // Once a row exists, deploy-alpha.yml's post-upload report is the only
  // writer of latestVersionCode/latestVersionName (see AppVersionGateService
  // .recordPublishedVersion on the Auth Service) — an operator editing them
  // here would just be overwritten by the next release, or could desync the
  // displayed "latest" from what CI actually measured. Before the first
  // report lands there's no row yet, so leave them editable to bootstrap.
  const ciOwned = Boolean(existing);
  const ciOwnedHelperText = ciOwned
    ? "Published automatically by CI on each release."
    : "CI will maintain this from the next release onwards.";
  const [draft, setDraft] = useState<Draft>(() => draftFrom(existing));
  const [pending, startTransition] = useTransition();

  const switchPlatform = (next: Platform) => {
    setPlatform(next);
    setDraft(draftFrom(findRow(rows, next)));
  };

  const save = () => {
    const min = Number(draft.minVersionCode);
    const prevMin = existing?.minVersionCode ?? 0;
    if (min > prevMin) {
      const ok = window.confirm(
        `Raise the floor to ${min}?\n\nEvery ${platform} device below version code ${min} will be blocked on its next check (within ~4 hours, or immediately on a wake push). They cannot sell until they update.\n\nContinue?`,
      );
      if (!ok) return;
    }

    startTransition(async () => {
      const result = await upsertAppVersionGate({
        appType: APP_TYPE,
        platform,
        minVersionCode: min,
        latestVersionCode: Number(draft.latestVersionCode),
        latestVersionName: draft.latestVersionName,
        updateUrl: draft.updateUrl,
        message: draft.message,
      });
      if (result.ok) {
        toast({
          variant: "success",
          title: "Saved",
          description: `${platform} version gate updated.`,
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Couldn't save",
          description: result.message,
        });
      }
    });
  };

  const remove = () => {
    const ok = window.confirm(
      `Delete the ${platform} gate?\n\nEvery blocked device is released on its next check. Use this to roll back a bad floor.`,
    );
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteAppVersionGate(APP_TYPE, platform);
      if (result.ok) {
        toast({
          variant: "success",
          title: "Gate deleted",
          description: `${platform} devices are unblocked on their next check.`,
        });
        setDraft(draftFrom(undefined));
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Couldn't delete",
          description: result.message,
        });
      }
    });
  };

  const field = (
    key: keyof Draft,
    label: string,
    placeholder: string,
    options?: { disabled?: boolean; helperText?: string },
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        value={draft[key]}
        placeholder={placeholder}
        disabled={options?.disabled}
        onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
      />
      {options?.helperText ? (
        <p className="text-xs text-muted-foreground">{options.helperText}</p>
      ) : null}
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex gap-2">
        {PLATFORMS.map((p) => (
          <Button
            key={p}
            variant={p === platform ? "default" : "outline"}
            onClick={() => switchPlatform(p)}
          >
            {p}
          </Button>
        ))}
      </div>

      {existing ? (
        <p className="text-sm text-muted-foreground">
          Last changed {existing.updatedAt ?? "—"} by{" "}
          {existing.updatedBy ?? "—"}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          No gate configured for {platform} — every device passes.
        </p>
      )}

      <div className="grid gap-4">
        {field(
          "minVersionCode",
          "Minimum version code (hard floor)",
          "2000120",
        )}
        {field(
          "latestVersionCode",
          "Latest version code (nag below)",
          "2000148",
          { disabled: ciOwned, helperText: ciOwnedHelperText },
        )}
        {field(
          "latestVersionName",
          "Latest version name",
          "1.324.148",
          { disabled: ciOwned, helperText: ciOwnedHelperText },
        )}
        {field(
          "updateUrl",
          "Update URL (browser fallback)",
          "https://play.google.com/store/apps/details?id=tz.co.settlo.v3",
        )}
        {field(
          "message",
          "Operator note shown on the block screen",
          "Optional",
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {existing ? (
          <Button variant="destructive" onClick={remove} disabled={pending}>
            Delete gate
          </Button>
        ) : null}
      </div>
    </div>
  );
}
