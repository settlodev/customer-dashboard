import { Monogram } from "@/components/admin/shared/monogram";
import { AccountLifecycle } from "@/types/admin/account-insights";

/**
 * Lifecycle / lead source card — the third tile in the account-detail
 * ownership row. Read-only summary of where the account came from.
 */
export function LifecycleCard({ lifecycle }: { lifecycle: AccountLifecycle }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-[18px] py-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Lifecycle · lead source
        </p>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Monogram
          label={lifecycle.avatarLabel}
          color={lifecycle.avatarColor}
          size="md"
          round
        />
        <div className="min-w-0">
          <div className="truncate text-[14px] font-semibold text-ink">
            {lifecycle.stage}
          </div>
          <div className="truncate font-mono text-[11px] text-muted-foreground">
            {lifecycle.source}
          </div>
        </div>
      </div>
    </div>
  );
}
