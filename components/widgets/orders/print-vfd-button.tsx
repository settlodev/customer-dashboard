import { UUID } from "node:crypto";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Opens the order's VFD (fiscal) printable receipt in a new tab — same
 * idiom as the GRN/day-session "Download PDF"/"Report" links. The
 * printable route (`/orders/[id]/vfd`) issues (and idempotently re-issues
 * on reprint) the fiscal receipt itself, and already surfaces the
 * verification code / fiscal number, so there's no separate pre-call or
 * summary dialog here — exactly one print happens per view.
 */
export function PrintVfdButton({
  orderId,
  orderNumber,
}: {
  orderId: UUID;
  orderNumber: string;
}) {
  return (
    <Button asChild variant="outline" size="sm">
      <a
        href={`/orders/${orderId}/vfd`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Print VFD receipt for order #${orderNumber}`}
      >
        <Printer className="mr-1.5 h-4 w-4" />
        Print VFD
      </a>
    </Button>
  );
}
