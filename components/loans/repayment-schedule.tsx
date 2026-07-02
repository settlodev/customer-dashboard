import { Calendar, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTzs, type RepaymentScheduleItem } from "@/types/loans/type";

const dt = (d?: string | null) =>
  d
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(d))
    : "—";

function StateCell({ item }: { item: RepaymentScheduleItem }) {
  if (item.state === "PAID") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-pos">
        <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-pos-tint">
          <Check className="h-3 w-3" />
        </span>
        Paid{item.paidOn ? ` · ${dt(item.paidOn)}` : ""}
      </span>
    );
  }
  if (item.state === "DUE") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warn">
        <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-warn-tint">
          <Calendar className="h-3 w-3" />
        </span>
        Due {dt(item.dueDate)}
      </span>
    );
  }
  if (item.state === "MISSED") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-neg">
        Missed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
      <span className="h-[18px] w-[18px] rounded-full border-[1.5px] border-line-2" />
      Upcoming
    </span>
  );
}

export function RepaymentSchedule({
  schedule,
  currencyCode,
  className,
}: {
  schedule: RepaymentScheduleItem[];
  currencyCode: string;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-surface/60 text-left text-xs font-semibold uppercase text-muted-foreground">
            <th className="px-4 py-3 font-mono">#</th>
            <th className="px-4 py-3">Due date</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {schedule.map((s) => (
            <tr key={s.number}>
              <td className="px-4 py-3 font-mono text-muted-foreground">
                {String(s.number).padStart(2, "0")}
              </td>
              <td className="px-4 py-3 font-medium">{dt(s.dueDate)}</td>
              <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                {formatTzs(s.amount, currencyCode)}
              </td>
              <td className="px-4 py-3">
                <StateCell item={s} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
