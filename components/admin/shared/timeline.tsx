import React from "react";

/**
 * Timeline — vertical event rail used in the account-detail "Activity" card.
 * Each item is a coloured dot connected by a hairline, with body text and a
 * mono timestamp. The last item drops its connector line.
 */

export interface TimelineItem {
  /** Body copy; wrap emphasised words in <b> for the ink-bold treatment. */
  text: React.ReactNode;
  time: string;
  /** Dot colour (CSS string). Defaults to a muted grey. */
  dotColor?: string;
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="flex flex-col">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <div key={idx} className="relative flex gap-3.5 pb-[18px] last:pb-0">
            <div className="flex flex-shrink-0 flex-col items-center">
              <span
                className="mt-[3px] h-[11px] w-[11px] flex-shrink-0 rounded-full border-[2.5px] border-card"
                style={{
                  backgroundColor: item.dotColor ?? "hsl(var(--muted-2))",
                  boxShadow: "0 0 0 1px hsl(var(--line-2))",
                }}
              />
              {!isLast && <span className="my-[3px] w-0.5 flex-1 bg-line" />}
            </div>
            <div className="min-w-0 flex-1 pb-0.5">
              <div className="text-[13px] text-ink-2 [&_b]:font-semibold [&_b]:text-ink">
                {item.text}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                {item.time}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
