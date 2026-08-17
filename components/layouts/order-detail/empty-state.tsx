/**
 * EmptyState — the in-panel "nothing here yet" block used inside a
 * `PanelCard`. Distinct from `components/layouts/no-items`, which is the
 * full-page empty state for a list route; this one is sized to sit inside a
 * detail panel next to populated siblings.
 */

export function EmptyState({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-5 py-11 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-canvas text-muted-2">
        {icon}
      </span>
      <div className="text-[14px] font-semibold text-ink-2">{title}</div>
      {sub && (
        <p className="max-w-[34ch] text-[12.5px] text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}
