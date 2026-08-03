/**
 * VList / VRow — key/value rows with hairline dividers and mono uppercase
 * keys, the `.od-vlist` / `.od-vrow` treatment. Used inside `RailCard`s that
 * show a flat set of facts (e.g. supplier details) rather than a table.
 */

export function VList({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}

export function VRow({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-[13px] last:border-b-0">
      <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </span>
      <span
        className="min-w-0 truncate text-right font-medium text-ink"
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </span>
    </div>
  );
}
