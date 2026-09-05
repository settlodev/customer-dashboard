import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Settings section card with the product-form header treatment: a 34px icon
 * box, title, description and an optional right-aligned slot (a badge or
 * per-section action). Body content stacks with `space-y-4`.
 *
 * `tone="danger"` frames destructive sections (disable business, delete…).
 */
export function SectionCard({
  icon,
  title,
  description,
  tone = "default",
  aside,
  className,
  bodyClassName,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  tone?: "default" | "danger";
  /** Right-aligned header slot — a badge, count, or action. */
  aside?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "rounded-xl shadow-sm",
        tone === "danger" && "border-neg/40",
        className,
      )}
    >
      <CardContent className={cn("space-y-4 pb-5 pt-5", bodyClassName)}>
        <div className="flex items-start gap-3">
          {icon && (
            <span
              className={cn(
                "grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] border border-line bg-canvas text-ink-2",
                tone === "danger" && "border-neg/30 bg-neg-tint text-neg",
              )}
            >
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold tracking-[-0.01em] text-ink">
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
