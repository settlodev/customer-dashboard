import type { ReactNode } from "react";

/**
 * Panel-level header used at the top of every settings panel. Mirrors the
 * Business Settings / Business Details layout: an h2 title and a small
 * description rendered outside any card, with an optional meta slot for
 * inline badges or identifiers (e.g. location code).
 */
export function PanelHeader({
  title,
  description,
  meta,
}: {
  title: string;
  description?: string;
  meta?: ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h2>
      {description && (
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      )}
      {meta && <div className="mt-2">{meta}</div>}
    </div>
  );
}
